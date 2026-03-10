const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const { Like, Save } = require('../models/Interaction');
const notificationService = require('./notificationService');

const HARD_DELETE_ENABLED = process.env.HARD_DELETE === 'true';
const MAX_BULK_DELETE = 50;

/**
 * Get client IP from request (handles proxies).
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
}

/**
 * Write an audit log entry.
 */
async function logAudit({ actionType, performedBy, targetId, targetModel = 'Post', metadata = {}, req }) {
  try {
    await AuditLog.create({
      actionType,
      performedBy,
      targetId,
      targetModel,
      metadata,
      ipAddress: req ? getClientIp(req) : undefined,
      userAgent: req?.headers?.['user-agent'] || undefined,
    });
  } catch (err) {
    console.error('AuditLog write failed:', err.message);
  }
}

/**
 * Remove all associated data for a post (likes, saves, comments, reports).
 */
async function removeAssociatedData(postId) {
  await Promise.all([
    Like.deleteMany({ post: postId }),
    Save.deleteMany({ post: postId }),
    Comment.deleteMany({ post: postId }),
    Report.updateMany(
      { post: postId, status: 'pending' },
      { status: 'resolved', actionTaken: 'removed', reviewNotes: 'Auto-resolved: post deleted by admin' }
    ),
  ]);
}

/**
 * Notify the post owner that their post was removed.
 */
async function notifyPostOwner(post, reason) {
  const message = reason
    ? `Your post "${post.title}" was removed: ${reason}`
    : `Your post "${post.title}" was removed due to policy violation.`;

  await notificationService.createNotification({
    recipient: post.author._id || post.author,
    type: 'system',
    post: post._id,
    message,
    metadata: { deleteReason: reason || 'policy_violation' },
  }).catch((err) => console.error('Delete notification failed:', err.message));
}

/**
 * Soft-delete a single post.
 */
async function softDeletePost(postId, adminId, reason, req) {
  const post = await Post.findById(postId);
  if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });
  if (post.isDeleted) throw Object.assign(new Error('Post is already deleted'), { statusCode: 400 });

  post.isDeleted = true;
  post.deletedAt = new Date();
  post.deletedBy = adminId;
  post.deleteReason = reason || undefined;
  post.status = 'archived';
  await post.save();

  // Decrement author's post count
  await User.findByIdAndUpdate(post.author, { $inc: { postsCount: -1 } });

  await logAudit({
    actionType: 'DELETE_POST',
    performedBy: adminId,
    targetId: post._id,
    metadata: { postTitle: post.title, reason, authorId: post.author.toString() },
    req,
  });

  await notifyPostOwner(post, reason);

  return post;
}

/**
 * Hard-delete a single post (permanent removal).
 */
async function hardDeletePost(postId, adminId, reason, req) {
  const post = await Post.findById(postId);
  if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });

  const postSnapshot = { title: post.title, authorId: post.author.toString(), _id: post._id };

  await removeAssociatedData(post._id);
  await User.findByIdAndUpdate(post.author, { $inc: { postsCount: -1 } });
  await notifyPostOwner(post, reason);
  await post.deleteOne();

  await logAudit({
    actionType: 'HARD_DELETE_POST',
    performedBy: adminId,
    targetId: postSnapshot._id,
    metadata: { postTitle: postSnapshot.title, reason, authorId: postSnapshot.authorId },
    req,
  });

  return postSnapshot;
}

/**
 * Delete a single post (soft or hard depending on config / explicit flag).
 */
async function deletePost(postId, adminId, { reason, hardDelete = false, req } = {}) {
  const shouldHardDelete = hardDelete || HARD_DELETE_ENABLED;

  if (shouldHardDelete) {
    return { result: await hardDeletePost(postId, adminId, reason, req), mode: 'hard' };
  }
  return { result: await softDeletePost(postId, adminId, reason, req), mode: 'soft' };
}

/**
 * Bulk delete posts with MongoDB session (transaction).
 * Enforces MAX_BULK_DELETE cap.
 */
async function bulkDeletePosts(postIds, adminId, { reason, hardDelete = false, req } = {}) {
  if (!Array.isArray(postIds) || postIds.length === 0) {
    throw Object.assign(new Error('No post IDs provided'), { statusCode: 400 });
  }
  if (postIds.length > MAX_BULK_DELETE) {
    throw Object.assign(new Error(`Cannot delete more than ${MAX_BULK_DELETE} posts at once`), { statusCode: 400 });
  }

  const shouldHardDelete = hardDelete || HARD_DELETE_ENABLED;
  const session = await mongoose.startSession();
  const results = { deleted: [], failed: [] };

  try {
    await session.withTransaction(async () => {
      const posts = await Post.find({ _id: { $in: postIds } }).session(session);

      for (const post of posts) {
        try {
          if (shouldHardDelete) {
            await removeAssociatedData(post._id);
            await User.findByIdAndUpdate(post.author, { $inc: { postsCount: -1 } }).session(session);
            await notifyPostOwner(post, reason);
            await Post.deleteOne({ _id: post._id }).session(session);
          } else {
            if (post.isDeleted) {
              results.failed.push({ id: post._id, reason: 'Already deleted' });
              continue;
            }
            post.isDeleted = true;
            post.deletedAt = new Date();
            post.deletedBy = adminId;
            post.deleteReason = reason || undefined;
            post.status = 'archived';
            await post.save({ session });
            await User.findByIdAndUpdate(post.author, { $inc: { postsCount: -1 } }).session(session);
            await notifyPostOwner(post, reason);
          }
          results.deleted.push(post._id);
        } catch (err) {
          results.failed.push({ id: post._id, reason: err.message });
        }
      }

      // Find IDs that were not found in DB
      const foundIds = new Set(posts.map((p) => p._id.toString()));
      postIds.forEach((id) => {
        if (!foundIds.has(id.toString())) {
          results.failed.push({ id, reason: 'Post not found' });
        }
      });
    });

    // Log audit outside transaction
    await logAudit({
      actionType: 'BULK_DELETE_POSTS',
      performedBy: adminId,
      targetId: adminId, // no single target for bulk
      metadata: {
        postIds: results.deleted,
        failedIds: results.failed,
        reason,
        mode: shouldHardDelete ? 'hard' : 'soft',
        count: results.deleted.length,
      },
      req,
    });
  } finally {
    await session.endSession();
  }

  return results;
}

/**
 * Restore a soft-deleted post.
 */
async function restorePost(postId, adminId, req) {
  const post = await Post.findById(postId);
  if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });
  if (!post.isDeleted) throw Object.assign(new Error('Post is not deleted'), { statusCode: 400 });

  post.isDeleted = false;
  post.deletedAt = undefined;
  post.deletedBy = undefined;
  post.deleteReason = undefined;
  post.status = 'published';
  await post.save();

  await User.findByIdAndUpdate(post.author, { $inc: { postsCount: 1 } });

  await logAudit({
    actionType: 'RESTORE_POST',
    performedBy: adminId,
    targetId: post._id,
    metadata: { postTitle: post.title },
    req,
  });

  return post;
}

module.exports = {
  deletePost,
  bulkDeletePosts,
  restorePost,
  logAudit,
  MAX_BULK_DELETE,
};

const mongoose = require('mongoose');
const BlogPost = require('../models/BlogPost');
const User = require('../models/User');
const Comment = require('../models/Comment');
const AuditLog = require('../models/AuditLog');
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
async function logAudit({ actionType, performedBy, targetId, metadata = {}, req }) {
  try {
    await AuditLog.create({
      actionType,
      performedBy,
      targetId,
      targetModel: 'BlogPost',
      metadata,
      ipAddress: req ? getClientIp(req) : undefined,
      userAgent: req?.headers?.['user-agent'] || undefined,
    });
  } catch (err) {
    console.error('AuditLog write failed:', err.message);
  }
}

/**
 * Remove all associated data for a blog post (comments).
 */
async function removeAssociatedData(blogPostId) {
  await Promise.all([
    Comment.deleteMany({ post: blogPostId }),
  ]);
}

/**
 * Notify the blog post owner that their article was removed.
 */
async function notifyPostOwner(blogPost, reason) {
  const message = reason
    ? `Your blog article "${blogPost.title}" was removed: ${reason}`
    : `Your blog article "${blogPost.title}" was removed due to policy violation.`;

  await notificationService.createNotification({
    recipient: blogPost.author._id || blogPost.author,
    type: 'system',
    message,
    metadata: { deleteReason: reason || 'policy_violation', blogPostId: blogPost._id },
  }).catch((err) => console.error('Delete notification failed:', err.message));
}

/**
 * Soft-delete a single blog post.
 */
async function softDeleteBlogPost(postId, adminId, reason, req) {
  const blogPost = await BlogPost.findById(postId);
  if (!blogPost) throw Object.assign(new Error('Blog post not found'), { statusCode: 404 });
  if (blogPost.isDeleted) throw Object.assign(new Error('Blog post is already deleted'), { statusCode: 400 });

  blogPost.isDeleted = true;
  blogPost.deletedAt = new Date();
  blogPost.deletedBy = adminId;
  blogPost.deleteReason = reason || undefined;
  blogPost.status = 'archived';
  await blogPost.save();

  await logAudit({
    actionType: 'DELETE_BLOG_POST',
    performedBy: adminId,
    targetId: blogPost._id,
    metadata: { postTitle: blogPost.title, reason, authorId: blogPost.author.toString() },
    req,
  });

  await notifyPostOwner(blogPost, reason);

  return blogPost;
}

/**
 * Hard-delete a single blog post (permanent removal).
 */
async function hardDeleteBlogPost(postId, adminId, reason, req) {
  const blogPost = await BlogPost.findById(postId);
  if (!blogPost) throw Object.assign(new Error('Blog post not found'), { statusCode: 404 });

  const snapshot = { title: blogPost.title, authorId: blogPost.author.toString(), _id: blogPost._id };

  await removeAssociatedData(blogPost._id);
  await notifyPostOwner(blogPost, reason);
  await blogPost.deleteOne();

  await logAudit({
    actionType: 'HARD_DELETE_BLOG_POST',
    performedBy: adminId,
    targetId: snapshot._id,
    metadata: { postTitle: snapshot.title, reason, authorId: snapshot.authorId },
    req,
  });

  return snapshot;
}

/**
 * Delete a single blog post (soft or hard depending on config / explicit flag).
 */
async function deleteBlogPost(postId, adminId, { reason, hardDelete = false, req } = {}) {
  const shouldHardDelete = hardDelete || HARD_DELETE_ENABLED;

  if (shouldHardDelete) {
    return { result: await hardDeleteBlogPost(postId, adminId, reason, req), mode: 'hard' };
  }
  return { result: await softDeleteBlogPost(postId, adminId, reason, req), mode: 'soft' };
}

/**
 * Bulk delete blog posts with MongoDB session (transaction).
 * Enforces MAX_BULK_DELETE cap.
 */
async function bulkDeleteBlogPosts(postIds, adminId, { reason, hardDelete = false, req } = {}) {
  if (!Array.isArray(postIds) || postIds.length === 0) {
    throw Object.assign(new Error('No blog post IDs provided'), { statusCode: 400 });
  }
  if (postIds.length > MAX_BULK_DELETE) {
    throw Object.assign(new Error(`Cannot delete more than ${MAX_BULK_DELETE} blog posts at once`), { statusCode: 400 });
  }

  const shouldHardDelete = hardDelete || HARD_DELETE_ENABLED;
  const session = await mongoose.startSession();
  const results = { deleted: [], failed: [] };

  try {
    await session.withTransaction(async () => {
      const posts = await BlogPost.find({ _id: { $in: postIds } }).session(session);

      for (const post of posts) {
        try {
          if (shouldHardDelete) {
            await removeAssociatedData(post._id);
            await notifyPostOwner(post, reason);
            await BlogPost.deleteOne({ _id: post._id }).session(session);
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
          results.failed.push({ id, reason: 'Blog post not found' });
        }
      });
    });

    // Log audit outside transaction
    await logAudit({
      actionType: 'BULK_DELETE_BLOG_POSTS',
      performedBy: adminId,
      targetId: adminId,
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
 * Restore a soft-deleted blog post.
 */
async function restoreBlogPost(postId, adminId, req) {
  const blogPost = await BlogPost.findById(postId);
  if (!blogPost) throw Object.assign(new Error('Blog post not found'), { statusCode: 404 });
  if (!blogPost.isDeleted) throw Object.assign(new Error('Blog post is not deleted'), { statusCode: 400 });

  blogPost.isDeleted = false;
  blogPost.deletedAt = undefined;
  blogPost.deletedBy = undefined;
  blogPost.deleteReason = undefined;
  blogPost.status = 'published';
  await blogPost.save();

  await logAudit({
    actionType: 'RESTORE_BLOG_POST',
    performedBy: adminId,
    targetId: blogPost._id,
    metadata: { postTitle: blogPost.title },
    req,
  });

  return blogPost;
}

module.exports = {
  deleteBlogPost,
  bulkDeleteBlogPosts,
  restoreBlogPost,
  logAudit,
  MAX_BULK_DELETE,
};

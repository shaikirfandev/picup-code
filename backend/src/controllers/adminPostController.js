const Post = require('../models/Post');
const AuditLog = require('../models/AuditLog');
const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');
const postDeletionService = require('../services/postDeletionService');

/**
 * GET /api/admin/posts/managed
 * Enhanced post listing with soft-delete support.
 */
exports.getAdminPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, reported, includeDeleted, search, sort = 'recent' } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = {};

    // By default, hide soft-deleted posts unless explicitly requested
    if (includeDeleted === 'true') {
      // show all
    } else if (includeDeleted === 'only') {
      filter.isDeleted = true;
    } else {
      filter.isDeleted = { $ne: true };
    }

    if (status) filter.status = status;
    if (reported === 'true') filter.reportCount = { $gt: 0 };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { likesCount: -1, createdAt: -1 };
    if (sort === 'reported') sortOption = { reportCount: -1, createdAt: -1 };
    if (sort === 'views') sortOption = { viewsCount: -1, createdAt: -1 };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('author', 'username displayName avatar')
        .populate('category', 'name slug')
        .populate('deletedBy', 'username displayName')
        .lean(),
      Post.countDocuments(filter),
    ]);

    // Add delete status label to each post
    const enriched = posts.map((p) => ({
      ...p,
      deleteStatus: p.isDeleted ? 'deleted' : 'active',
    }));

    ApiResponse.paginated(res, enriched, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/posts/:id
 * Soft-delete (or hard-delete) a single post.
 */
exports.deletePost = async (req, res, next) => {
  try {
    const { reason, hardDelete } = req.body || {};
    const { result, mode } = await postDeletionService.deletePost(
      req.params.id,
      req.user._id,
      { reason, hardDelete: hardDelete === true, req }
    );

    ApiResponse.success(res, { postId: req.params.id, mode }, `Post ${mode === 'hard' ? 'permanently deleted' : 'soft-deleted'}`);
  } catch (error) {
    if (error.statusCode) {
      return ApiResponse.error(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * POST /api/admin/posts/bulk-delete
 * Bulk soft-delete (or hard-delete) multiple posts with transaction.
 */
exports.bulkDeletePosts = async (req, res, next) => {
  try {
    const { postIds, reason, hardDelete } = req.body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return ApiResponse.error(res, 'postIds array is required', 400);
    }

    if (postIds.length > postDeletionService.MAX_BULK_DELETE) {
      return ApiResponse.error(
        res,
        `Cannot delete more than ${postDeletionService.MAX_BULK_DELETE} posts at once`,
        400
      );
    }

    const results = await postDeletionService.bulkDeletePosts(
      postIds,
      req.user._id,
      { reason, hardDelete: hardDelete === true, req }
    );

    ApiResponse.success(res, results, `${results.deleted.length} posts deleted`);
  } catch (error) {
    if (error.statusCode) {
      return ApiResponse.error(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * PATCH /api/admin/posts/:id/restore
 * Restore a soft-deleted post.
 */
exports.restorePost = async (req, res, next) => {
  try {
    const post = await postDeletionService.restorePost(req.params.id, req.user._id, req);
    ApiResponse.success(res, post, 'Post restored');
  } catch (error) {
    if (error.statusCode) {
      return ApiResponse.error(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * GET /api/admin/audit-logs
 * View audit log history.
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, actionType } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = {};
    if (actionType) filter.actionType = actionType;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('performedBy', 'username displayName avatar')
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, logs, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

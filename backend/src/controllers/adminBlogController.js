const BlogPost = require('../models/BlogPost');
const AuditLog = require('../models/AuditLog');
const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');
const blogDeletionService = require('../services/blogDeletionService');

/**
 * GET /api/admin/blogs-manage
 * Enhanced blog post listing with soft-delete support.
 */
exports.getAdminBlogPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, category, includeDeleted, search, sort = 'recent' } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = {};

    // By default, hide soft-deleted blog posts unless explicitly requested
    if (includeDeleted === 'true') {
      // show all
    } else if (includeDeleted === 'only') {
      filter.isDeleted = true;
    } else {
      filter.isDeleted = { $ne: true };
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { likesCount: -1, createdAt: -1 };
    if (sort === 'views') sortOption = { viewsCount: -1, createdAt: -1 };
    if (sort === 'comments') sortOption = { commentsCount: -1, createdAt: -1 };

    const [posts, total] = await Promise.all([
      BlogPost.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('author', 'username displayName avatar')
        .populate('deletedBy', 'username displayName')
        .lean(),
      BlogPost.countDocuments(filter),
    ]);

    // Add delete status label to each blog post
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
 * DELETE /api/admin/blogs-manage/:id
 * Soft-delete (or hard-delete) a single blog post.
 */
exports.deleteBlogPost = async (req, res, next) => {
  try {
    const { reason, hardDelete } = req.body || {};
    const { result, mode } = await blogDeletionService.deleteBlogPost(
      req.params.id,
      req.user._id,
      { reason, hardDelete: hardDelete === true, req }
    );

    ApiResponse.success(res, { blogPostId: req.params.id, mode }, `Blog post ${mode === 'hard' ? 'permanently deleted' : 'soft-deleted'}`);
  } catch (error) {
    if (error.statusCode) {
      return ApiResponse.error(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * POST /api/admin/blogs-manage/bulk-delete
 * Bulk soft-delete (or hard-delete) multiple blog posts with transaction.
 */
exports.bulkDeleteBlogPosts = async (req, res, next) => {
  try {
    const { postIds, reason, hardDelete } = req.body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return ApiResponse.error(res, 'postIds array is required', 400);
    }

    if (postIds.length > blogDeletionService.MAX_BULK_DELETE) {
      return ApiResponse.error(
        res,
        `Cannot delete more than ${blogDeletionService.MAX_BULK_DELETE} blog posts at once`,
        400
      );
    }

    const results = await blogDeletionService.bulkDeleteBlogPosts(
      postIds,
      req.user._id,
      { reason, hardDelete: hardDelete === true, req }
    );

    ApiResponse.success(res, results, `${results.deleted.length} blog posts deleted`);
  } catch (error) {
    if (error.statusCode) {
      return ApiResponse.error(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * PATCH /api/admin/blogs-manage/:id/restore
 * Restore a soft-deleted blog post.
 */
exports.restoreBlogPost = async (req, res, next) => {
  try {
    const blogPost = await blogDeletionService.restoreBlogPost(req.params.id, req.user._id, req);
    ApiResponse.success(res, blogPost, 'Blog post restored');
  } catch (error) {
    if (error.statusCode) {
      return ApiResponse.error(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * GET /api/admin/blogs-manage/audit-logs
 * View blog-related audit log history.
 */
exports.getBlogAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, actionType } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = { targetModel: 'BlogPost' };
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

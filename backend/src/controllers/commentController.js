const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');

// Get comments for a post
exports.getComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { skip } = paginate(null, page, limit);

    const [comments, total] = await Promise.all([
      Comment.find({ post: req.params.postId, parentComment: null })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'username displayName avatar'),
      Comment.countDocuments({ post: req.params.postId, parentComment: null }),
    ]);

    // Get replies count for each comment
    const commentIds = comments.map((c) => c._id);
    const replyCounts = await Comment.aggregate([
      { $match: { parentComment: { $in: commentIds } } },
      { $group: { _id: '$parentComment', count: { $sum: 1 } } },
    ]);

    const replyMap = {};
    replyCounts.forEach((r) => {
      replyMap[r._id.toString()] = r.count;
    });

    const commentsWithReplies = comments.map((c) => ({
      ...c.toObject(),
      repliesCount: replyMap[c._id.toString()] || 0,
    }));

    ApiResponse.paginated(res, commentsWithReplies, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// Get replies for a comment
exports.getReplies = async (req, res, next) => {
  try {
    const replies = await Comment.find({ parentComment: req.params.commentId })
      .sort({ createdAt: 1 })
      .populate('user', 'username displayName avatar');

    ApiResponse.success(res, replies);
  } catch (error) {
    next(error);
  }
};

// Create comment
exports.createComment = async (req, res, next) => {
  try {
    const { text, parentComment } = req.body;

    const post = await Post.findById(req.params.postId);
    if (!post) return ApiResponse.notFound(res, 'Post not found');

    const comment = await Comment.create({
      text,
      post: post._id,
      user: req.user._id,
      parentComment: parentComment || null,
    });

    await Post.findByIdAndUpdate(post._id, { $inc: { commentsCount: 1 } });

    const populated = await Comment.findById(comment._id).populate(
      'user',
      'username displayName avatar'
    );

    ApiResponse.created(res, populated, 'Comment added');
  } catch (error) {
    next(error);
  }
};

// Update comment
exports.updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return ApiResponse.notFound(res, 'Comment not found');

    if (comment.user.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res);
    }

    comment.text = req.body.text;
    comment.isEdited = true;
    await comment.save();

    const populated = await Comment.findById(comment._id).populate(
      'user',
      'username displayName avatar'
    );

    ApiResponse.success(res, populated, 'Comment updated');
  } catch (error) {
    next(error);
  }
};

// Delete comment
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return ApiResponse.notFound(res, 'Comment not found');

    if (
      comment.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return ApiResponse.forbidden(res);
    }

    // Delete replies too
    await Comment.deleteMany({ parentComment: comment._id });
    await comment.deleteOne();
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

    ApiResponse.success(res, null, 'Comment deleted');
  } catch (error) {
    next(error);
  }
};

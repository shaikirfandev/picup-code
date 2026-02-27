const User = require('../models/User');
const Post = require('../models/Post');
const BlogPost = require('../models/BlogPost');
const Report = require('../models/Report');
const Category = require('../models/Category');
const AIGeneration = require('../models/AIGeneration');
const Comment = require('../models/Comment');
const LoginLog = require('../models/LoginLog');
const Advertisement = require('../models/Advertisement');
const Payment = require('../models/Payment');
const { Like, Save } = require('../models/Interaction');
const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');
const { uploadImageToGridFS } = require('../config/gridfs');
const slugify = require('slugify');

// Dashboard analytics
exports.getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersThisMonth,
      totalPosts,
      newPostsThisMonth,
      totalViews,
      totalClicks,
      totalAiGenerations,
      pendingReports,
      activeUsers,
      topPosts,
      userGrowth,
      postGrowth,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Post.countDocuments({ status: 'published' }),
      Post.countDocuments({ status: 'published', createdAt: { $gte: thirtyDaysAgo } }),
      Post.aggregate([{ $group: { _id: null, total: { $sum: '$viewsCount' } } }]),
      Post.aggregate([{ $group: { _id: null, total: { $sum: '$clicksCount' } } }]),
      AIGeneration.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      User.countDocuments({ lastLogin: { $gte: sevenDaysAgo } }),
      Post.find({ status: 'published' })
        .sort({ viewsCount: -1 })
        .limit(5)
        .select('title image viewsCount likesCount')
        .populate('author', 'username avatar'),
      // User growth by day (last 30 days)
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Post growth by day (last 30 days)
      Post.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    ApiResponse.success(res, {
      stats: {
        totalUsers,
        newUsersThisMonth,
        totalPosts,
        newPostsThisMonth,
        totalViews: totalViews[0]?.total || 0,
        totalClicks: totalClicks[0]?.total || 0,
        totalAiGenerations,
        pendingReports,
        activeUsers,
      },
      topPosts,
      charts: {
        userGrowth,
        postGrowth,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all users (admin)
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-refreshToken'),
      User.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, users, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// Update user role
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return ApiResponse.error(res, 'Invalid role', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-refreshToken -password');

    if (!user) return ApiResponse.notFound(res, 'User not found');
    ApiResponse.success(res, user, 'User role updated');
  } catch (error) {
    next(error);
  }
};

// Update user status (ban/suspend/activate)
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'banned'].includes(status)) {
      return ApiResponse.error(res, 'Invalid status', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-refreshToken -password');

    if (!user) return ApiResponse.notFound(res, 'User not found');
    ApiResponse.success(res, user, `User ${status}`);
  } catch (error) {
    next(error);
  }
};

// Verify user
exports.verifyUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    ).select('-refreshToken -password');

    if (!user) return ApiResponse.notFound(res, 'User not found');
    ApiResponse.success(res, user, 'User verified');
  } catch (error) {
    next(error);
  }
};

// Content moderation - Get all posts
exports.getPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, reported } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = {};
    if (status) filter.status = status;
    if (reported === 'true') filter.reportCount = { $gt: 0 };
    // Exclude soft-deleted posts by default
    filter.isDeleted = { $ne: true };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('author', 'username displayName avatar')
        .populate('category', 'name slug'),
      Post.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, posts, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// Approve/Reject/Delete post
exports.moderatePost = async (req, res, next) => {
  try {
    const { action } = req.body; // approve, reject, delete, feature, nsfw

    const post = await Post.findById(req.params.id);
    if (!post) return ApiResponse.notFound(res, 'Post not found');

    switch (action) {
      case 'approve':
        post.status = 'published';
        break;
      case 'reject':
        post.status = 'rejected';
        break;
      case 'delete':
        await post.deleteOne();
        return ApiResponse.success(res, null, 'Post deleted');
      case 'feature':
        post.isFeatured = !post.isFeatured;
        break;
      case 'nsfw':
        post.isNSFW = !post.isNSFW;
        break;
      default:
        return ApiResponse.error(res, 'Invalid action', 400);
    }

    await post.save();
    ApiResponse.success(res, post, `Post ${action}d`);
  } catch (error) {
    next(error);
  }
};

// Get reports
exports.getReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = 'pending', priority, reason, search } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = {};
    if (status !== 'all') filter.status = status;
    if (priority) filter.priority = priority;
    if (reason) filter.reason = reason;
    if (search) {
      // Search by reporter username or post/blog title — requires populated data, so we do a subquery
      const matchingUsers = await User.find({ username: { $regex: search, $options: 'i' } }).select('_id');
      const matchingPosts = await Post.find({ title: { $regex: search, $options: 'i' } }).select('_id');
      const matchingBlogPosts = await BlogPost.find({ title: { $regex: search, $options: 'i' } }).select('_id');
      filter.$or = [
        { reporter: { $in: matchingUsers.map((u) => u._id) } },
        { post: { $in: matchingPosts.map((p) => p._id) } },
        { blogPost: { $in: matchingBlogPosts.map((p) => p._id) } },
      ];
    }

    const [reports, total, stats] = await Promise.all([
      Report.find(filter)
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('reporter', 'username displayName avatar')
        .populate('reportedUser', 'username displayName avatar status')
        .populate('post', 'title image status reportCount author')
        .populate('blogPost', 'title coverImage status reportCount author slug category')
        .populate('reviewedBy', 'username displayName'),
      Report.countDocuments(filter),
      // Aggregate stats for dashboard summary
      Report.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusCounts = {};
    stats.forEach((s) => { statusCounts[s._id] = s.count; });

    return res.status(200).json({
      success: true,
      message: 'Success',
      data: reports,
      pagination: getPaginationMeta(total, page, limit),
      statusCounts,
    });
  } catch (error) {
    next(error);
  }
};

// Get single report detail
exports.getReportDetail = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporter', 'username displayName avatar email createdAt')
      .populate('reportedUser', 'username displayName avatar email status role createdAt postsCount')
      .populate({
        path: 'post',
        populate: { path: 'author', select: 'username displayName avatar' },
      })
      .populate({
        path: 'blogPost',
        populate: { path: 'author', select: 'username displayName avatar' },
      })
      .populate('reviewedBy', 'username displayName');

    if (!report) return ApiResponse.notFound(res, 'Report not found');

    // Get all reports for the same post/blogPost for context
    let relatedReports = [];
    if (report.post) {
      relatedReports = await Report.find({ post: report.post._id, _id: { $ne: report._id } })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('reporter', 'username displayName avatar');
    } else if (report.blogPost) {
      relatedReports = await Report.find({ blogPost: report.blogPost._id, _id: { $ne: report._id } })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('reporter', 'username displayName avatar');
    }

    // Get reporter's report history count
    const reporterTotalReports = await Report.countDocuments({ reporter: report.reporter._id });

    // Get reported user's total reports received
    const reportedUserTotalReports = report.reportedUser
      ? await Report.countDocuments({ reportedUser: report.reportedUser._id })
      : 0;

    ApiResponse.success(res, {
      report,
      relatedReports,
      reporterTotalReports,
      reportedUserTotalReports,
    });
  } catch (error) {
    next(error);
  }
};

// Get all reports for a specific post
exports.getReportsByPost = async (req, res, next) => {
  try {
    const reports = await Report.find({ post: req.params.postId })
      .sort({ createdAt: -1 })
      .populate('reporter', 'username displayName avatar')
      .populate('reviewedBy', 'username displayName');

    const reasonBreakdown = await Report.aggregate([
      { $match: { post: require('mongoose').Types.ObjectId.createFromHexString(req.params.postId) } },
      { $group: { _id: '$reason', count: { $sum: 1 } } },
    ]);

    ApiResponse.success(res, { reports, reasonBreakdown, totalReports: reports.length });
  } catch (error) {
    next(error);
  }
};

// Get reports for a specific blog post
exports.getReportsByBlogPost = async (req, res, next) => {
  try {
    const reports = await Report.find({ blogPost: req.params.blogPostId })
      .sort({ createdAt: -1 })
      .populate('reporter', 'username displayName avatar')
      .populate('reviewedBy', 'username displayName');

    const reasonBreakdown = await Report.aggregate([
      { $match: { blogPost: require('mongoose').Types.ObjectId.createFromHexString(req.params.blogPostId) } },
      { $group: { _id: '$reason', count: { $sum: 1 } } },
    ]);

    ApiResponse.success(res, { reports, reasonBreakdown, totalReports: reports.length });
  } catch (error) {
    next(error);
  }
};

// Resolve report (enhanced with actions)
exports.resolveReport = async (req, res, next) => {
  try {
    const { status, actionTaken, reviewNotes } = req.body;

    const report = await Report.findById(req.params.id).populate('post').populate('blogPost').populate('reportedUser');
    if (!report) return ApiResponse.notFound(res, 'Report not found');

    // Update report
    report.status = status || report.status;
    report.actionTaken = actionTaken || report.actionTaken;
    report.reviewNotes = reviewNotes || report.reviewNotes;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();

    // Execute action on post/blogPost/user
    if (actionTaken === 'removed' && report.post) {
      await Post.findByIdAndUpdate(report.post._id, { status: 'rejected' });
      // Resolve all pending reports for this post
      await Report.updateMany(
        { post: report.post._id, status: 'pending', _id: { $ne: report._id } },
        { status: 'resolved', actionTaken: 'removed', reviewedBy: req.user._id, reviewedAt: new Date(), reviewNotes: 'Auto-resolved: post removed' }
      );
    } else if (actionTaken === 'removed' && report.blogPost) {
      await BlogPost.findByIdAndUpdate(report.blogPost._id, { status: 'archived', isDeleted: true, deletedAt: new Date(), deletedBy: req.user._id, deleteReason: 'Removed via report moderation' });
      // Resolve all pending reports for this blog post
      await Report.updateMany(
        { blogPost: report.blogPost._id, status: 'pending', _id: { $ne: report._id } },
        { status: 'resolved', actionTaken: 'removed', reviewedBy: req.user._id, reviewedAt: new Date(), reviewNotes: 'Auto-resolved: blog post removed' }
      );
    } else if (actionTaken === 'hidden' && report.post) {
      await Post.findByIdAndUpdate(report.post._id, { status: 'pending' });
    } else if (actionTaken === 'hidden' && report.blogPost) {
      await BlogPost.findByIdAndUpdate(report.blogPost._id, { status: 'archived' });
    } else if (actionTaken === 'banned' && report.reportedUser) {
      await User.findByIdAndUpdate(report.reportedUser._id, { status: 'banned' });
      // Resolve all pending reports for this user
      await Report.updateMany(
        { reportedUser: report.reportedUser._id, status: 'pending', _id: { $ne: report._id } },
        { status: 'resolved', actionTaken: 'banned', reviewedBy: req.user._id, reviewedAt: new Date(), reviewNotes: 'Auto-resolved: user banned' }
      );
    } else if (actionTaken === 'warned' && report.reportedUser) {
      await User.findByIdAndUpdate(report.reportedUser._id, { status: 'suspended' });
    }

    await report.populate('reviewedBy', 'username displayName');
    ApiResponse.success(res, report, 'Report updated');
  } catch (error) {
    next(error);
  }
};

// Category management
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, color } = req.body;
    const slug = slugify(name, { lower: true, strict: true });

    let imageUrl;
    if (req.file) {
      const result = await uploadImageToGridFS(req.file.buffer, req.file.originalname, req.file.mimetype);
      imageUrl = result.url;
    }

    const category = await Category.create({
      name, slug, description, icon, color,
      image: imageUrl || undefined,
    });
    ApiResponse.created(res, category, 'Category created');
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.name) {
      updates.slug = slugify(updates.name, { lower: true, strict: true });
    }

    if (req.file) {
      const result = await uploadImageToGridFS(req.file.buffer, req.file.originalname, req.file.mimetype);
      updates.image = result.url;
    }

    const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!category) return ApiResponse.notFound(res, 'Category not found');
    ApiResponse.success(res, category, 'Category updated');
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return ApiResponse.notFound(res, 'Category not found');
    ApiResponse.success(res, null, 'Category deleted');
  } catch (error) {
    next(error);
  }
};

// AI Usage management
exports.getAiLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.user = userId;

    const [logs, total] = await Promise.all([
      AIGeneration.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'username avatar'),
      AIGeneration.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, logs, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// Set user AI generation limit
exports.setUserAiLimit = async (req, res, next) => {
  try {
    const { limit } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { aiDailyLimit: limit },
      { new: true }
    ).select('username aiDailyLimit aiGenerationsToday');

    if (!user) return ApiResponse.notFound(res, 'User not found');
    ApiResponse.success(res, user, 'AI limit updated');
  } catch (error) {
    next(error);
  }
};

// ── Login Analytics ──

// Get daily login statistics
exports.getLoginAnalytics = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [dailyLogins, totalLogins, uniqueUsers, loginsByMethod] = await Promise.all([
      LoginLog.aggregate([
        { $match: { createdAt: { $gte: startDate }, success: true } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' },
          },
        },
        {
          $project: {
            _id: 1,
            count: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      LoginLog.countDocuments({ createdAt: { $gte: startDate }, success: true }),
      LoginLog.distinct('user', { createdAt: { $gte: startDate }, success: true }),
      LoginLog.aggregate([
        { $match: { createdAt: { $gte: startDate }, success: true } },
        { $group: { _id: '$method', count: { $sum: 1 } } },
      ]),
    ]);

    ApiResponse.success(res, {
      dailyLogins,
      totalLogins,
      uniqueUsersCount: uniqueUsers.length,
      loginsByMethod,
    });
  } catch (error) {
    next(error);
  }
};

// Get registered users with emails
exports.getUserEmails = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = {};
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('username email displayName avatar role status lastLogin createdAt accountType'),
      User.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, users, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

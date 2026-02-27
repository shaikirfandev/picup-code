const User = require('../models/User');
const Post = require('../models/Post');
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
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = {};
    if (status !== 'all') filter.status = status;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('reporter', 'username avatar')
        .populate('reportedUser', 'username avatar')
        .populate('post', 'title image'),
      Report.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, reports, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// Resolve report
exports.resolveReport = async (req, res, next) => {
  try {
    const { status, actionTaken, reviewNotes } = req.body;

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status,
        actionTaken,
        reviewNotes,
        reviewedBy: req.user._id,
      },
      { new: true }
    );

    if (!report) return ApiResponse.notFound(res, 'Report not found');
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

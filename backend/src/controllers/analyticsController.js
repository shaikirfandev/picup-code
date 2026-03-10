/**
 * Admin Analytics Controller
 * Production-grade endpoints for login analytics, metrics, user management,
 * CSV export, top users, and recent activity.
 */
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const BlogPost = require('../models/BlogPost');
const Report = require('../models/Report');
const AIGeneration = require('../models/AIGeneration');
const Comment = require('../models/Comment');
const LoginLog = require('../models/LoginLog');
const DailyStats = require('../models/DailyStats');
const { Like, Save } = require('../models/Interaction');
const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');
const { computeDailyStats, backfillDailyStats } = require('../utils/dailyStatsComputer');

// ─────────────────────────────────────────────────────────────
// In-memory cache for dashboard stats (avoids heavy aggregation on every hit)
// ─────────────────────────────────────────────────────────────
const statsCache = {
  data: null,
  expiry: 0,
  TTL: 60 * 1000, // 1 minute
};

function getCachedStats() {
  if (statsCache.data && Date.now() < statsCache.expiry) return statsCache.data;
  return null;
}

function setCachedStats(data) {
  statsCache.data = data;
  statsCache.expiry = Date.now() + statsCache.TTL;
}

// ─────────────────────────────────────────────────────────────
// GET /api/admin/stats/overview
// ─────────────────────────────────────────────────────────────
exports.getOverview = async (req, res, next) => {
  try {
    const cached = getCachedStats();
    if (cached) return ApiResponse.success(res, cached);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersToday,
      totalPosts,
      totalViewsResult,
      totalLikesCount,
      totalSavesCount,
      activeReports,
      totalAIGenerations,
      activeUsersLast24h,
      weeklyActiveUsers,
      monthlyActiveUsers,
      todayLogins,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      Post.countDocuments({ status: 'published' }),
      Post.aggregate([{ $group: { _id: null, total: { $sum: '$viewsCount' } } }]),
      Like.countDocuments(),
      Save.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      AIGeneration.countDocuments(),
      // Active = logged in within 24h
      User.countDocuments({ lastLogin: { $gte: oneDayAgo } }),
      User.countDocuments({ lastLogin: { $gte: sevenDaysAgo } }),
      User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } }),
      LoginLog.countDocuments({ createdAt: { $gte: todayStart }, success: true }),
    ]);

    const result = {
      totalUsers,
      newUsersToday,
      totalPosts,
      totalViews: totalViewsResult[0]?.total || 0,
      totalLikes: totalLikesCount,
      totalSaves: totalSavesCount,
      activeReports,
      totalAIGenerations,
      activeUsersLast24h,
      weeklyActiveUsers,
      monthlyActiveUsers,
      todayLogins,
    };

    setCachedStats(result);
    ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/stats/logins?days=30
// Daily login chart data (from DailyStats collection, with fallback)
// ─────────────────────────────────────────────────────────────
exports.getLoginStats = async (req, res, next) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 90);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().slice(0, 10);

    // Try pre-computed stats first
    let dailyStats = await DailyStats.find({ date: { $gte: startStr } })
      .sort({ date: 1 })
      .select('date logins uniqueLogins newUsers posts likes saves loginsByMethod loginsByDevice topCountries')
      .lean();

    // If we don't have enough pre-computed stats, fall back to live aggregation
    if (dailyStats.length < days * 0.5) {
      const liveData = await LoginLog.aggregate([
        { $match: { createdAt: { $gte: startDate }, success: true } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            logins: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' },
          },
        },
        {
          $project: {
            date: '$_id',
            logins: 1,
            uniqueLogins: { $size: '$uniqueUsers' },
          },
        },
        { $sort: { date: 1 } },
      ]);

      // Merge live data into dailyStats
      const statsMap = new Map(dailyStats.map((s) => [s.date, s]));
      liveData.forEach((ld) => {
        if (!statsMap.has(ld.date)) {
          statsMap.set(ld.date, { date: ld.date, logins: ld.logins, uniqueLogins: ld.uniqueLogins });
        }
      });
      dailyStats = Array.from(statsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }

    // Summary metrics
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [activeToday, weeklyActive, monthlyActive, loginsByMethod, topCountries] = await Promise.all([
      User.countDocuments({ lastLogin: { $gte: oneDayAgo } }),
      User.countDocuments({ lastLogin: { $gte: sevenDaysAgo } }),
      User.countDocuments({ lastLogin: { $gte: startDate } }),
      LoginLog.aggregate([
        { $match: { createdAt: { $gte: startDate }, success: true } },
        { $group: { _id: '$method', count: { $sum: 1 } } },
      ]),
      LoginLog.aggregate([
        { $match: { createdAt: { $gte: startDate }, success: true, country: { $ne: null } } },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    ApiResponse.success(res, {
      dailyStats,
      summary: {
        activeToday,
        weeklyActive,
        monthlyActive,
      },
      loginsByMethod: loginsByMethod.reduce((acc, m) => { acc[m._id] = m.count; return acc; }, {}),
      topCountries: topCountries.map((c) => ({ country: c._id, count: c.count })),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/users?page=1&limit=20&search=&sort=&role=&status=
// Enhanced user management list with login + device info
// ─────────────────────────────────────────────────────────────
exports.getUsersList = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, sort = '-createdAt', role, status } = req.query;
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

    const sortObj = {};
    if (sort.startsWith('-')) {
      sortObj[sort.slice(1)] = -1;
    } else {
      sortObj[sort] = 1;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .select('username email displayName avatar role status isVerified lastLogin loginCount lastLoginDevice lastLoginCountry lastLoginIP postsCount createdAt accountType'),
      User.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, users, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/users/export?format=csv
// CSV export of all users — admin only
// ─────────────────────────────────────────────────────────────
exports.exportUsers = async (req, res, next) => {
  try {
    // Audit log
    console.log(`[AuditLog] CSV Export by admin ${req.user._id} (${req.user.email}) at ${new Date().toISOString()} from IP ${req.ip}`);

    const users = await User.find()
      .sort({ createdAt: -1 })
      .select('username email displayName role status isVerified lastLogin loginCount lastLoginDevice lastLoginCountry postsCount createdAt')
      .lean();

    // Build CSV
    const headers = [
      'Username', 'Email', 'Display Name', 'Role', 'Status', 'Verified',
      'Last Login', 'Login Count', 'Last Device', 'Country', 'Posts', 'Registered',
    ];

    const csvRows = [headers.join(',')];

    for (const u of users) {
      const row = [
        escapeCsvField(u.username),
        escapeCsvField(u.email),
        escapeCsvField(u.displayName || ''),
        u.role,
        u.status,
        u.isVerified ? 'Yes' : 'No',
        u.lastLogin ? new Date(u.lastLogin).toISOString() : 'Never',
        u.loginCount || 0,
        escapeCsvField(u.lastLoginDevice || ''),
        escapeCsvField(u.lastLoginCountry || ''),
        u.postsCount || 0,
        new Date(u.createdAt).toISOString(),
      ];
      csvRows.push(row.join(','));
    }

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=users-export-${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

function escapeCsvField(val) {
  if (!val) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ─────────────────────────────────────────────────────────────
// GET /api/admin/activity/recent
// Recent logins, posts, reports, AI generations
// ─────────────────────────────────────────────────────────────
exports.getRecentActivity = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const [recentLogins, recentPosts, recentReports, recentAI] = await Promise.all([
      LoginLog.find({ success: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('user', 'username displayName avatar')
        .select('user browser os deviceType country createdAt method')
        .lean(),
      Post.find({ status: 'published' })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('author', 'username displayName avatar')
        .select('title image viewsCount likesCount author createdAt')
        .lean(),
      Report.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('reporter', 'username displayName avatar')
        .populate('post', 'title')
        .populate('blogPost', 'title')
        .select('reporter post blogPost reason status priority createdAt')
        .lean(),
      AIGeneration.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('user', 'username displayName avatar')
        .select('user prompt style status createdAt')
        .lean(),
    ]);

    ApiResponse.success(res, {
      recentLogins,
      recentPosts,
      recentReports,
      recentAI,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/users/top?metric=posts&limit=10
// Top users by different metrics
// ─────────────────────────────────────────────────────────────
exports.getTopUsers = async (req, res, next) => {
  try {
    const metric = req.query.metric || 'posts'; // posts|likes|active|engagement
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    let result = [];

    switch (metric) {
      case 'posts':
        result = await User.find({ postsCount: { $gt: 0 } })
          .sort({ postsCount: -1 })
          .limit(limit)
          .select('username displayName avatar postsCount loginCount lastLogin')
          .lean();
        break;

      case 'likes':
        // Users whose posts received the most total likes
        result = await Post.aggregate([
          { $match: { status: 'published' } },
          { $group: { _id: '$author', totalLikes: { $sum: '$likesCount' } } },
          { $sort: { totalLikes: -1 } },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              pipeline: [{ $project: { username: 1, displayName: 1, avatar: 1, postsCount: 1 } }],
              as: 'user',
            },
          },
          { $unwind: '$user' },
          {
            $project: {
              _id: '$user._id',
              username: '$user.username',
              displayName: '$user.displayName',
              avatar: '$user.avatar',
              postsCount: '$user.postsCount',
              totalLikes: 1,
            },
          },
        ]);
        break;

      case 'active':
        // Most logins
        result = await User.find({ loginCount: { $gt: 0 } })
          .sort({ loginCount: -1 })
          .limit(limit)
          .select('username displayName avatar loginCount lastLogin postsCount')
          .lean();
        break;

      case 'engagement':
        // Composite: posts + likes received + login count
        result = await Post.aggregate([
          { $match: { status: 'published' } },
          {
            $group: {
              _id: '$author',
              totalLikes: { $sum: '$likesCount' },
              totalViews: { $sum: '$viewsCount' },
              postCount: { $sum: 1 },
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              pipeline: [{ $project: { username: 1, displayName: 1, avatar: 1, loginCount: 1 } }],
              as: 'user',
            },
          },
          { $unwind: '$user' },
          {
            $addFields: {
              engagementScore: {
                $add: [
                  { $multiply: ['$postCount', 10] },
                  { $multiply: ['$totalLikes', 5] },
                  { $multiply: ['$totalViews', 1] },
                  { $multiply: ['$user.loginCount', 2] },
                ],
              },
            },
          },
          { $sort: { engagementScore: -1 } },
          { $limit: limit },
          {
            $project: {
              _id: '$user._id',
              username: '$user.username',
              displayName: '$user.displayName',
              avatar: '$user.avatar',
              engagementScore: 1,
              totalLikes: 1,
              totalViews: 1,
              postCount: 1,
            },
          },
        ]);
        break;

      default:
        result = [];
    }

    ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/admin/stats/compute — manually trigger daily stats computation
// ─────────────────────────────────────────────────────────────
exports.triggerCompute = async (req, res, next) => {
  try {
    const { date, backfill } = req.body;

    if (backfill) {
      const days = Math.min(parseInt(backfill) || 30, 90);
      const results = await backfillDailyStats(days);
      return ApiResponse.success(res, { computed: results.length, results });
    }

    await computeDailyStats(date || undefined);
    ApiResponse.success(res, null, `Stats computed for ${date || 'yesterday'}`);
  } catch (error) {
    next(error);
  }
};

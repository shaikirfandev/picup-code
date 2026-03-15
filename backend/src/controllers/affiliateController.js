const Post = require('../models/Post');
const AffiliateClick = require('../models/AffiliateClick');
const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');

// ── Get user's affiliate posts (any authenticated user) ──────────────────────
exports.getMyAffiliatePosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = {
      author: req.user._id,
      isAffiliate: true,
      isDeleted: { $ne: true },
    };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .select('title image video mediaType productUrl affiliateLinks clicksCount viewsCount likesCount isAffiliate createdAt')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Post.countDocuments(filter),
    ]);

    // For free users, strip detailed click numbers per link
    const isPaid = req.isPaidUser;
    const sanitized = posts.map((p) => ({
      ...p,
      affiliateLinks: p.affiliateLinks?.map((l) => ({
        url: l.url,
        label: l.label,
        clicks: isPaid ? l.clicks : undefined,
      })),
      clicksCount: isPaid ? p.clicksCount : undefined,
    }));

    ApiResponse.paginated(res, sanitized, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// ── Get affiliate summary (basic for free, detailed for paid) ────────────────
exports.getAffiliateSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const isPaid = req.isPaidUser;

    // Count affiliate posts — available to everyone
    const totalAffiliatePosts = await Post.countDocuments({
      author: userId,
      isAffiliate: true,
      isDeleted: { $ne: true },
    });

    // Basic summary for all users
    const summary = {
      totalAffiliatePosts,
      isPaid,
    };

    // Paid users get full stats
    if (isPaid) {
      const [clickStats] = await AffiliateClick.aggregate([
        { $match: { ownerId: userId, isBot: false } },
        {
          $group: {
            _id: null,
            totalClicks: { $sum: 1 },
            uniqueSessions: { $addToSet: '$sessionId' },
            suspiciousClicks: { $sum: { $cond: ['$isSuspicious', 1, 0] } },
          },
        },
      ]);

      // Top performing posts
      const topPosts = await Post.find({
        author: userId,
        isAffiliate: true,
        isDeleted: { $ne: true },
      })
        .select('title image video mediaType productUrl clicksCount viewsCount')
        .sort('-clicksCount')
        .limit(5)
        .lean();

      // Recent clicks (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentClicks = await AffiliateClick.aggregate([
        {
          $match: {
            ownerId: userId,
            isBot: false,
            isSuspicious: false,
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            clicks: { $sum: 1 },
            uniqueSessions: { $addToSet: '$sessionId' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      summary.totalClicks = clickStats?.totalClicks || 0;
      summary.uniqueClicks = clickStats?.uniqueSessions?.length || 0;
      summary.suspiciousClicks = clickStats?.suspiciousClicks || 0;
      summary.topPosts = topPosts;
      summary.recentClicks = recentClicks.map((d) => ({
        date: d._id,
        clicks: d.clicks,
        uniqueClicks: d.uniqueSessions?.length || 0,
      }));

      // Estimated revenue (same logic as creatorAnalyticsService)
      const CONVERSION_RATE = 0.02;
      const AVG_ORDER = 25;
      const COMMISSION = 0.05;
      const total = clickStats?.totalClicks || 0;
      summary.conversionEstimate = Math.round(total * CONVERSION_RATE);
      summary.revenueEstimate = Math.round(total * CONVERSION_RATE * AVG_ORDER * COMMISSION * 100) / 100;
    }

    ApiResponse.success(res, summary, 'Affiliate summary retrieved');
  } catch (error) {
    next(error);
  }
};

// ── Get single post affiliate performance (paid only) ────────────────────────
exports.getPostAffiliateStats = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return ApiResponse.notFound(res, 'Post not found');
    if (post.author.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'Not your post');
    }

    const { period = '30d' } = req.query;
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const matchStage = {
      postId: post._id,
      isBot: false,
      isSuspicious: false,
      createdAt: { $gte: since },
    };

    const [clicksByDay, deviceBreakdown, geoBreakdown, referrerBreakdown] = await Promise.all([
      AffiliateClick.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            clicks: { $sum: 1 },
            uniqueSessions: { $addToSet: '$sessionId' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      AffiliateClick.aggregate([
        { $match: matchStage },
        { $group: { _id: '$deviceType', count: { $sum: 1 } } },
      ]),
      AffiliateClick.aggregate([
        { $match: matchStage },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      AffiliateClick.aggregate([
        { $match: matchStage },
        { $group: { _id: '$referrer', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const totalClicks = clicksByDay.reduce((s, d) => s + d.clicks, 0);

    ApiResponse.success(res, {
      postId: post._id,
      title: post.title,
      productUrl: post.productUrl,
      affiliateLinks: post.affiliateLinks,
      totalClicks,
      clicksByDay: clicksByDay.map((d) => ({
        date: d._id,
        clicks: d.clicks,
        uniqueClicks: d.uniqueSessions?.length || 0,
      })),
      deviceBreakdown: deviceBreakdown.reduce((acc, d) => {
        acc[d._id || 'unknown'] = d.count;
        return acc;
      }, {}),
      geoBreakdown: geoBreakdown.map((g) => ({ country: g._id || 'Unknown', count: g.count })),
      referrerBreakdown: referrerBreakdown.map((r) => ({ source: r._id || 'unknown', count: r.count })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Creator Analytics Controller
 * 
 * Handles all creator analytics dashboard API endpoints.
 * All endpoints require authentication + paid account (except event tracking).
 */
const mongoose = require('mongoose');
const {
  getCreatorOverview,
  getEngagementTimeline,
  getFollowerGrowth,
  getPostAnalytics,
  getPostsPerformance,
  getAffiliateAnalytics,
  getAudienceInsights,
  getAIInsights,
  exportAnalyticsCSV,
} = require('../services/creatorAnalyticsService');

const {
  trackEvent,
  trackAffiliateClick,
  getRealtimePostCounters,
  getRealtimeCreatorCounters,
  getLiveViewerCount,
} = require('../services/analyticsEventService');

const { safeRedis } = require('../config/redis');
const { ApiResponse } = require('../utils/apiResponse');

// ── Cache helper ─────────────────────────────────────────────────────────────
const CACHE_TTL = {
  overview: 120,       // 2 min
  timeline: 300,       // 5 min
  followers: 300,      // 5 min
  postAnalytics: 180,  // 3 min
  postsTable: 180,     // 3 min
  affiliate: 300,      // 5 min
  audience: 600,       // 10 min
  aiInsights: 900,     // 15 min
};

async function getCached(key, ttl, fetcher) {
  const cached = await safeRedis.get(key);
  if (cached) {
    try { return JSON.parse(cached); } catch {}
  }
  const data = await fetcher();
  await safeRedis.set(key, JSON.stringify(data), 'EX', ttl);
  return data;
}

// ── 1. Overview Dashboard ────────────────────────────────────────────────────
async function getOverview(req, res) {
  try {
    const userId = req.user._id;
    const { period = '30d', startDate, endDate } = req.query;

    const cacheKey = `ca:overview:${userId}:${period}:${startDate || ''}:${endDate || ''}`;
    const data = await getCached(cacheKey, CACHE_TTL.overview, () =>
      getCreatorOverview(userId, period, startDate, endDate)
    );

    return ApiResponse.success(res, data, 'Overview retrieved successfully');
  } catch (error) {
    console.error('getOverview error:', error);
    return ApiResponse.error(res, 'Failed to retrieve analytics overview');
  }
}

// ── 2. Engagement Timeline ───────────────────────────────────────────────────
async function getTimeline(req, res) {
  try {
    const userId = req.user._id;
    const { period = '30d', startDate, endDate } = req.query;

    const cacheKey = `ca:timeline:${userId}:${period}:${startDate || ''}:${endDate || ''}`;
    const data = await getCached(cacheKey, CACHE_TTL.timeline, () =>
      getEngagementTimeline(userId, period, startDate, endDate)
    );

    return ApiResponse.success(res, data, 'Timeline retrieved successfully');
  } catch (error) {
    console.error('getTimeline error:', error);
    return ApiResponse.error(res, 'Failed to retrieve engagement timeline');
  }
}

// ── 3. Follower Growth ───────────────────────────────────────────────────────
async function getFollowers(req, res) {
  try {
    const userId = req.user._id;
    const { period = '30d', startDate, endDate } = req.query;

    const cacheKey = `ca:followers:${userId}:${period}:${startDate || ''}:${endDate || ''}`;
    const data = await getCached(cacheKey, CACHE_TTL.followers, () =>
      getFollowerGrowth(userId, period, startDate, endDate)
    );

    return ApiResponse.success(res, data, 'Follower growth retrieved successfully');
  } catch (error) {
    console.error('getFollowers error:', error);
    return ApiResponse.error(res, 'Failed to retrieve follower growth');
  }
}

// ── 4. Single Post Analytics ─────────────────────────────────────────────────
async function getSinglePostAnalytics(req, res) {
  try {
    const userId = req.user._id;
    const { postId } = req.params;
    const { period = '30d', startDate, endDate } = req.query;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return ApiResponse.error(res, 'Invalid post ID', 400);
    }

    const cacheKey = `ca:post:${postId}:${period}:${startDate || ''}:${endDate || ''}`;
    const data = await getCached(cacheKey, CACHE_TTL.postAnalytics, () =>
      getPostAnalytics(postId, userId, period, startDate, endDate)
    );

    if (!data) {
      return ApiResponse.notFound(res, 'Post not found or you do not own this post');
    }

    return ApiResponse.success(res, data, 'Post analytics retrieved successfully');
  } catch (error) {
    console.error('getSinglePostAnalytics error:', error);
    return ApiResponse.error(res, 'Failed to retrieve post analytics');
  }
}

// ── 5. Posts Performance Table ───────────────────────────────────────────────
async function getPostsTable(req, res) {
  try {
    const userId = req.user._id;
    const {
      period = '30d',
      startDate,
      endDate,
      sort = 'impressions',
      order = 'desc',
      page = 1,
      limit = 20,
      mediaType,
      tag,
      minImpressions,
    } = req.query;

    const data = await getPostsPerformance(userId, {
      period,
      customStart: startDate,
      customEnd: endDate,
      sort,
      order,
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 50),
      mediaType,
      tag,
      minImpressions,
    });

    return ApiResponse.paginated(res, data.posts, data.pagination, 'Posts performance retrieved');
  } catch (error) {
    console.error('getPostsTable error:', error);
    return ApiResponse.error(res, 'Failed to retrieve posts performance');
  }
}

// ── 6. Affiliate Analytics ───────────────────────────────────────────────────
async function getAffiliate(req, res) {
  try {
    const userId = req.user._id;
    const { period = '30d', startDate, endDate } = req.query;

    const cacheKey = `ca:affiliate:${userId}:${period}:${startDate || ''}:${endDate || ''}`;
    const data = await getCached(cacheKey, CACHE_TTL.affiliate, () =>
      getAffiliateAnalytics(userId, period, startDate, endDate)
    );

    return ApiResponse.success(res, data, 'Affiliate analytics retrieved successfully');
  } catch (error) {
    console.error('getAffiliate error:', error);
    return ApiResponse.error(res, 'Failed to retrieve affiliate analytics');
  }
}

// ── 7. Audience Insights ─────────────────────────────────────────────────────
async function getAudience(req, res) {
  try {
    const userId = req.user._id;
    const { period = '30d', startDate, endDate } = req.query;

    const cacheKey = `ca:audience:${userId}:${period}:${startDate || ''}:${endDate || ''}`;
    const data = await getCached(cacheKey, CACHE_TTL.audience, () =>
      getAudienceInsights(userId, period, startDate, endDate)
    );

    return ApiResponse.success(res, data, 'Audience insights retrieved successfully');
  } catch (error) {
    console.error('getAudience error:', error);
    return ApiResponse.error(res, 'Failed to retrieve audience insights');
  }
}

// ── 8. AI Insights ───────────────────────────────────────────────────────────
async function getAI(req, res) {
  try {
    const userId = req.user._id;

    const cacheKey = `ca:ai:${userId}`;
    const data = await getCached(cacheKey, CACHE_TTL.aiInsights, () =>
      getAIInsights(userId)
    );

    return ApiResponse.success(res, data, 'AI insights retrieved successfully');
  } catch (error) {
    console.error('getAI error:', error);
    return ApiResponse.error(res, 'Failed to retrieve AI insights');
  }
}

// ── 9. Real-time Counters ────────────────────────────────────────────────────
async function getRealtimeStats(req, res) {
  try {
    const userId = req.user._id;
    const creatorCounters = await getRealtimeCreatorCounters(userId.toString());

    return ApiResponse.success(res, creatorCounters, 'Real-time stats retrieved');
  } catch (error) {
    console.error('getRealtimeStats error:', error);
    return ApiResponse.error(res, 'Failed to retrieve real-time stats');
  }
}

async function getRealtimePostStats(req, res) {
  try {
    const { postId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return ApiResponse.error(res, 'Invalid post ID', 400);
    }

    const [postCounters, liveViewers] = await Promise.all([
      getRealtimePostCounters(postId),
      getLiveViewerCount(postId),
    ]);

    return ApiResponse.success(res, {
      ...postCounters,
      liveViewers,
    }, 'Real-time post stats retrieved');
  } catch (error) {
    console.error('getRealtimePostStats error:', error);
    return ApiResponse.error(res, 'Failed to retrieve real-time post stats');
  }
}

// ── 10. Track Event (Public, rate-limited) ───────────────────────────────────
async function trackPostEvent(req, res) {
  try {
    const {
      postId,
      eventType,
      referrer,
      watchDuration,
      completionRate,
      sessionId,
    } = req.body;

    if (!postId || !eventType) {
      return ApiResponse.error(res, 'postId and eventType are required', 400);
    }

    const validEvents = ['view', 'like', 'unlike', 'share', 'click', 'save', 'unsave', 'comment'];
    if (!validEvents.includes(eventType)) {
      return ApiResponse.error(res, 'Invalid event type', 400);
    }

    // Find post to get owner
    const Post = require('../models/Post');
    const post = await Post.findById(postId).select('author productUrl').lean();
    if (!post) {
      return ApiResponse.error(res, 'Post not found', 404);
    }

    const result = await trackEvent({
      postId,
      ownerId: post.author,
      viewerId: req.user?._id || null,
      eventType,
      req,
      metadata: {
        referrer,
        watchDuration,
        completionRate,
        sessionId,
        affiliateUrl: eventType === 'click' ? post.productUrl : null,
      },
    });

    // Also track affiliate click if it's a click on a post with productUrl
    if (eventType === 'click' && post.productUrl) {
      await trackAffiliateClick({
        postId,
        ownerId: post.author,
        clickerId: req.user?._id || null,
        productUrl: post.productUrl,
        req,
        metadata: { referrer, sessionId },
      });
    }

    return ApiResponse.success(res, result, 'Event tracked');
  } catch (error) {
    console.error('trackPostEvent error:', error);
    // Non-blocking — still return success status
    return ApiResponse.success(res, { success: false }, 'Event tracking failed silently');
  }
}

// ── 11. Export CSV ───────────────────────────────────────────────────────────
async function exportCSV(req, res) {
  try {
    const userId = req.user._id;
    const { period = '30d', startDate, endDate } = req.query;

    const csv = await exportAnalyticsCSV(userId, period, startDate, endDate);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${period}-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (error) {
    console.error('exportCSV error:', error);
    return ApiResponse.error(res, 'Failed to export analytics data');
  }
}

// ── 12. Check Access (for frontend to decide UI) ────────────────────────────
async function checkAccess(req, res) {
  try {
    const user = req.user;
    const hasAccess = user.role === 'admin' || (user.accountType === 'paid' && (!user.subscription || user.subscription.isActive));

    return ApiResponse.success(res, {
      hasAccess,
      accountType: user.accountType,
      plan: user.subscription?.plan || 'none',
      isActive: user.subscription?.isActive ?? false,
    }, 'Access check complete');
  } catch (error) {
    console.error('checkAccess error:', error);
    return ApiResponse.error(res, 'Failed to check access');
  }
}

module.exports = {
  getOverview,
  getTimeline,
  getFollowers,
  getSinglePostAnalytics,
  getPostsTable,
  getAffiliate,
  getAudience,
  getAI,
  getRealtimeStats,
  getRealtimePostStats,
  trackPostEvent,
  exportCSV,
  checkAccess,
};

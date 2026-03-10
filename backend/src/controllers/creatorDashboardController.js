const CreatorDashboardService = require('../services/creatorDashboardService');
const { ApiResponse } = require('../utils/apiResponse');
const { redisClient } = require('../config/redis');

/**
 * CreatorDashboardController — Handles all Professional Creator Dashboard API endpoints.
 * Uses Redis caching at the controller layer for hot-path endpoints.
 */
class CreatorDashboardController {

  // ─── OVERVIEW ────────────────────────────────────────────────

  /**
   * GET /api/creator-dashboard/overview
   * Returns the complete dashboard overview.
   */
  static async getOverview(req, res) {
    try {
      const { period = '30d' } = req.query;
      const data = await CreatorDashboardService.getOverview(req.user._id, period);
      return ApiResponse.success(res, data, 'Dashboard overview fetched');
    } catch (err) {
      console.error('[CreatorDashboard] Overview error:', err.message);
      return ApiResponse.error(res, 'Failed to fetch dashboard overview');
    }
  }

  // ─── CONTENT PERFORMANCE ─────────────────────────────────────

  /**
   * GET /api/creator-dashboard/content-performance
   * Returns content performance analytics with sorting/filtering.
   */
  static async getContentPerformance(req, res) {
    try {
      const {
        page = 1, limit = 20, sortBy = 'totalViews',
        sortOrder = 'desc', mediaType, period = '30d', search,
      } = req.query;

      const data = await CreatorDashboardService.getContentPerformance(req.user._id, {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        mediaType,
        period,
        search,
      });

      return ApiResponse.success(res, data, 'Content performance fetched');
    } catch (err) {
      console.error('[CreatorDashboard] Content performance error:', err.message);
      return ApiResponse.error(res, 'Failed to fetch content performance');
    }
  }

  /**
   * GET /api/creator-dashboard/performance-heatmap
   * Returns the 7×24 engagement heatmap.
   */
  static async getPerformanceHeatmap(req, res) {
    try {
      const { period = '30d' } = req.query;
      const cacheKey = `dashboard:heatmap:${req.user._id}:${period}`;

      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return ApiResponse.success(res, JSON.parse(cached), 'Heatmap fetched (cached)');
      } catch (_) {}

      const data = await CreatorDashboardService.getPerformanceHeatmap(req.user._id, period);

      try { await redisClient.setex(cacheKey, 600, JSON.stringify(data)); } catch (_) {}

      return ApiResponse.success(res, data, 'Performance heatmap fetched');
    } catch (err) {
      console.error('[CreatorDashboard] Heatmap error:', err.message);
      return ApiResponse.error(res, 'Failed to fetch heatmap');
    }
  }

  /**
   * GET /api/creator-dashboard/engagement-trends
   * Returns engagement trends over time.
   */
  static async getEngagementTrends(req, res) {
    try {
      const { period = '30d' } = req.query;
      const data = await CreatorDashboardService.getEngagementTrends(req.user._id, period);
      return ApiResponse.success(res, data, 'Engagement trends fetched');
    } catch (err) {
      console.error('[CreatorDashboard] Engagement trends error:', err.message);
      return ApiResponse.error(res, 'Failed to fetch engagement trends');
    }
  }

  // ─── AUDIENCE INSIGHTS ───────────────────────────────────────

  /**
   * GET /api/creator-dashboard/audience-insights
   * Returns comprehensive audience analytics.
   */
  static async getAudienceInsights(req, res) {
    try {
      const { period = '30d' } = req.query;
      const data = await CreatorDashboardService.getAudienceInsights(req.user._id, period);
      return ApiResponse.success(res, data, 'Audience insights fetched');
    } catch (err) {
      console.error('[CreatorDashboard] Audience insights error:', err.message);
      return ApiResponse.error(res, 'Failed to fetch audience insights');
    }
  }

  // ─── MONETIZATION ────────────────────────────────────────────

  /**
   * GET /api/creator-dashboard/monetization
   * Returns monetization dashboard data.
   */
  static async getMonetization(req, res) {
    try {
      const { period = '30d' } = req.query;
      const data = await CreatorDashboardService.getMonetizationData(req.user._id, period);
      return ApiResponse.success(res, data, 'Monetization data fetched');
    } catch (err) {
      console.error('[CreatorDashboard] Monetization error:', err.message);
      return ApiResponse.error(res, 'Failed to fetch monetization data');
    }
  }

  /**
   * POST /api/creator-dashboard/monetization/enable
   * Enable monetization for the creator.
   */
  static async enableMonetization(req, res) {
    try {
      const data = await CreatorDashboardService.enableMonetization(req.user._id);
      return ApiResponse.success(res, data, 'Monetization enabled');
    } catch (err) {
      if (err.message.includes('100 followers')) {
        return ApiResponse.error(res, err.message, 403);
      }
      console.error('[CreatorDashboard] Enable monetization error:', err.message);
      return ApiResponse.error(res, 'Failed to enable monetization');
    }
  }

  // ─── CONTENT MANAGEMENT ──────────────────────────────────────

  /**
   * GET /api/creator-dashboard/content
   * Returns content management console data.
   */
  static async getContentManagement(req, res) {
    try {
      const { page = 1, limit = 20, status, mediaType, search, sortBy, sortOrder } = req.query;
      const data = await CreatorDashboardService.getContentManagement(req.user._id, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        mediaType,
        search,
        sortBy,
        sortOrder,
      });
      return ApiResponse.success(res, data, 'Content management data fetched');
    } catch (err) {
      console.error('[CreatorDashboard] Content management error:', err.message);
      return ApiResponse.error(res, 'Failed to fetch content management data');
    }
  }

  /**
   * POST /api/creator-dashboard/content/schedule
   * Schedule a post for future publishing.
   */
  static async schedulePost(req, res) {
    try {
      const { postId, scheduledFor, timezone, recurring, recurrencePattern, recurrenceEndDate, notes } = req.body;

      if (!postId || !scheduledFor) {
        return ApiResponse.error(res, 'postId and scheduledFor are required', 400);
      }

      const data = await CreatorDashboardService.schedulePost(req.user._id, postId, scheduledFor, {
        timezone,
        recurring,
        recurrencePattern,
        recurrenceEndDate,
        notes,
      });

      return ApiResponse.created(res, data, 'Post scheduled successfully');
    } catch (err) {
      console.error('[CreatorDashboard] Schedule post error:', err.message);
      return ApiResponse.error(res, err.message || 'Failed to schedule post', 400);
    }
  }

  /**
   * DELETE /api/creator-dashboard/content/schedule/:id
   * Cancel a scheduled post.
   */
  static async cancelScheduledPost(req, res) {
    try {
      const data = await CreatorDashboardService.cancelScheduledPost(req.user._id, req.params.id);
      return ApiResponse.success(res, data, 'Scheduled post cancelled');
    } catch (err) {
      console.error('[CreatorDashboard] Cancel schedule error:', err.message);
      return ApiResponse.error(res, err.message || 'Failed to cancel scheduled post', 400);
    }
  }

  /**
   * PATCH /api/creator-dashboard/content/:postId/pin
   * Toggle pin status on a post.
   */
  static async togglePinPost(req, res) {
    try {
      const data = await CreatorDashboardService.togglePinPost(req.user._id, req.params.postId);
      return ApiResponse.success(res, data, `Post ${data.isPinned ? 'pinned' : 'unpinned'}`);
    } catch (err) {
      console.error('[CreatorDashboard] Pin toggle error:', err.message);
      return ApiResponse.error(res, err.message || 'Failed to toggle pin', 400);
    }
  }

  /**
   * POST /api/creator-dashboard/content/bulk
   * Bulk update posts (archive, publish, draft, delete).
   */
  static async bulkUpdatePosts(req, res) {
    try {
      const { postIds, action } = req.body;
      if (!postIds || !Array.isArray(postIds) || !action) {
        return ApiResponse.error(res, 'postIds (array) and action are required', 400);
      }
      const data = await CreatorDashboardService.bulkUpdatePosts(req.user._id, postIds, action);
      return ApiResponse.success(res, data, `Bulk ${action} completed`);
    } catch (err) {
      console.error('[CreatorDashboard] Bulk update error:', err.message);
      return ApiResponse.error(res, err.message || 'Failed to bulk update', 400);
    }
  }

  // ─── AI / GROWTH INSIGHTS ───────────────────────────────────

  /**
   * GET /api/creator-dashboard/growth-insights
   * Returns AI-powered growth recommendations.
   */
  static async getGrowthInsights(req, res) {
    try {
      const data = await CreatorDashboardService.getGrowthInsights(req.user._id);
      return ApiResponse.success(res, data, 'Growth insights fetched');
    } catch (err) {
      console.error('[CreatorDashboard] Growth insights error:', err.message);
      return ApiResponse.error(res, 'Failed to fetch growth insights');
    }
  }

  // ─── ACTIVITY FEED ───────────────────────────────────────────

  /**
   * GET /api/creator-dashboard/activity
   * Returns the real-time activity feed.
   */
  static async getActivityFeed(req, res) {
    try {
      const { page = 1, limit = 30, eventType } = req.query;
      const data = await CreatorDashboardService.getActivityFeed(req.user._id, {
        page: parseInt(page),
        limit: parseInt(limit),
        eventType,
      });
      return ApiResponse.success(res, data, 'Activity feed fetched');
    } catch (err) {
      console.error('[CreatorDashboard] Activity feed error:', err.message);
      return ApiResponse.error(res, 'Failed to fetch activity feed');
    }
  }

  /**
   * POST /api/creator-dashboard/activity/read
   * Mark activity events as read.
   */
  static async markActivityRead(req, res) {
    try {
      const { eventIds } = req.body; // 'all' or array of IDs
      await CreatorDashboardService.markActivityRead(req.user._id, eventIds || 'all');
      return ApiResponse.success(res, null, 'Activity marked as read');
    } catch (err) {
      console.error('[CreatorDashboard] Mark read error:', err.message);
      return ApiResponse.error(res, 'Failed to mark activity as read');
    }
  }

  // ─── CREATOR PROFILE / SETTINGS ──────────────────────────────

  /**
   * GET /api/creator-dashboard/profile
   * Returns the creator profile settings.
   */
  static async getCreatorProfile(req, res) {
    try {
      const data = await CreatorDashboardService.getCreatorProfile(req.user._id);
      return ApiResponse.success(res, data, 'Creator profile fetched');
    } catch (err) {
      console.error('[CreatorDashboard] Profile fetch error:', err.message);
      return ApiResponse.error(res, 'Failed to fetch creator profile');
    }
  }

  /**
   * PUT /api/creator-dashboard/profile
   * Update creator profile settings.
   */
  static async updateCreatorProfile(req, res) {
    try {
      const data = await CreatorDashboardService.updateCreatorProfile(req.user._id, req.body);
      return ApiResponse.success(res, data, 'Creator profile updated');
    } catch (err) {
      console.error('[CreatorDashboard] Profile update error:', err.message);
      return ApiResponse.error(res, 'Failed to update creator profile');
    }
  }

  // ─── COMMENT MODERATION ──────────────────────────────────────

  /**
   * GET /api/creator-dashboard/comments
   * Returns comments for moderation.
   */
  static async getCommentsForModeration(req, res) {
    try {
      const { page = 1, limit = 30, filter = 'all' } = req.query;
      const data = await CreatorDashboardService.getCommentsForModeration(req.user._id, {
        page: parseInt(page),
        limit: parseInt(limit),
        filter,
      });
      return ApiResponse.success(res, data, 'Comments fetched');
    } catch (err) {
      console.error('[CreatorDashboard] Comments fetch error:', err.message);
      return ApiResponse.error(res, 'Failed to fetch comments');
    }
  }

  /**
   * POST /api/creator-dashboard/comments/:commentId/moderate
   * Moderate a comment (approve, hide, delete).
   */
  static async moderateComment(req, res) {
    try {
      const { action } = req.body;
      if (!['approve', 'hide', 'delete'].includes(action)) {
        return ApiResponse.error(res, 'Invalid action. Use: approve, hide, or delete', 400);
      }
      const data = await CreatorDashboardService.moderateComment(req.user._id, req.params.commentId, action);
      return ApiResponse.success(res, data, `Comment ${action}d successfully`);
    } catch (err) {
      console.error('[CreatorDashboard] Comment moderate error:', err.message);
      return ApiResponse.error(res, err.message || 'Failed to moderate comment', 400);
    }
  }
}

module.exports = CreatorDashboardController;

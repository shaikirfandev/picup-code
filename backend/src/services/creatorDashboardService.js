const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const ContentMetrics = require('../models/ContentMetrics');
const CreatorRevenue = require('../models/CreatorRevenue');
const CreatorProfile = require('../models/CreatorProfile');
const AudienceDemographic = require('../models/AudienceDemographic');
const ActivityEvent = require('../models/ActivityEvent');
const ScheduledPost = require('../models/ScheduledPost');
const PostEvent = require('../models/PostEvent');
const PostAnalyticsDaily = require('../models/PostAnalyticsDaily');
const CreatorAnalyticsSnapshot = require('../models/CreatorAnalyticsSnapshot');
const { Like, Save, Follow } = require('../models/Interaction');
const Payment = require('../models/Payment');
const Wallet = require('../models/Wallet');
const Advertisement = require('../models/Advertisement');
const AffiliateClick = require('../models/AffiliateClick');
const { redisClient } = require('../config/redis');

/**
 * CreatorDashboardService — Comprehensive service powering the Professional Creator Dashboard.
 * Orchestrates all data queries, aggregation, caching, and real-time metrics.
 */
class CreatorDashboardService {

  // ─── OVERVIEW ────────────────────────────────────────────────

  /**
   * Get full overview metrics for the creator dashboard home.
   */
  static async getOverview(creatorId, period = '30d') {
    const cacheKey = `dashboard:overview:${creatorId}:${period}`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (_) {}

    const { startDate, endDate, prevStart, prevEnd } = this._getPeriodDates(period);

    // Parallel queries
    const [
      user,
      totalPosts,
      currentSnapshot,
      previousSnapshot,
      recentActivity,
      revenueStats,
      topPosts,
      realtimeCounters,
    ] = await Promise.all([
      User.findById(creatorId).select('followersCount followingCount postsCount profileViews username displayName avatar'),
      Post.countDocuments({ user: creatorId, status: 'published' }),
      this._aggregateSnapshots(creatorId, startDate, endDate),
      this._aggregateSnapshots(creatorId, prevStart, prevEnd),
      ActivityEvent.find({ creator: creatorId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      this._getRevenueStats(creatorId, startDate, endDate),
      this._getTopPerformingPosts(creatorId, 5),
      this._getRealtimeCounters(creatorId),
    ]);

    const metrics = {
      totalFollowers: user?.followersCount || 0,
      profileVisits: currentSnapshot.profileVisits || 0,
      totalContentPosted: totalPosts,
      totalImpressions: currentSnapshot.impressions || 0,
      engagementRate: currentSnapshot.engagementRate || 0,
      totalRevenue: revenueStats.totalRevenue,
    };

    const growth = {
      followers: this._calcGrowth(currentSnapshot.newFollowers, previousSnapshot.newFollowers),
      impressions: this._calcGrowth(currentSnapshot.impressions, previousSnapshot.impressions),
      engagement: this._calcGrowth(currentSnapshot.engagementRate, previousSnapshot.engagementRate),
      revenue: this._calcGrowth(revenueStats.totalRevenue, revenueStats.prevRevenue),
      profileVisits: this._calcGrowth(currentSnapshot.profileVisits, previousSnapshot.profileVisits),
    };

    const result = {
      user: {
        username: user?.username,
        displayName: user?.displayName,
        avatar: user?.avatar,
      },
      metrics,
      growth,
      revenueStats,
      topPosts,
      recentActivity,
      realtimeCounters,
      period,
    };

    try {
      await redisClient.setex(cacheKey, 120, JSON.stringify(result)); // 2 min cache
    } catch (_) {}

    return result;
  }

  // ─── CONTENT PERFORMANCE ─────────────────────────────────────

  /**
   * Get detailed content performance analytics with sorting and filtering.
   */
  static async getContentPerformance(creatorId, {
    page = 1,
    limit = 20,
    sortBy = 'totalViews',
    sortOrder = 'desc',
    mediaType,
    period = '30d',
    search,
  } = {}) {
    const { startDate, endDate } = this._getPeriodDates(period);

    // Build post filter
    const postFilter = { user: creatorId, status: 'published' };
    if (mediaType) postFilter.mediaType = mediaType;
    if (search) postFilter.title = { $regex: search, $options: 'i' };

    const posts = await Post.find(postFilter)
      .select('title slug mediaType image video thumbnails createdAt likesCount commentsCount viewsCount sharesCount savesCount isPinned')
      .sort({ createdAt: -1 })
      .lean();

    const postIds = posts.map(p => p._id);

    // Get content metrics for these posts
    const metricsMap = {};
    const metrics = await ContentMetrics.find({ post: { $in: postIds } }).lean();
    metrics.forEach(m => { metricsMap[m.post.toString()] = m; });

    // Get period-specific analytics
    const periodAnalytics = await PostAnalyticsDaily.aggregate([
      {
        $match: {
          post: { $in: postIds },
          date: { $gte: startDate.toISOString().split('T')[0], $lte: endDate.toISOString().split('T')[0] },
        },
      },
      {
        $group: {
          _id: '$post',
          periodViews: { $sum: '$views' },
          periodLikes: { $sum: '$likes' },
          periodComments: { $sum: '$comments' },
          periodShares: { $sum: '$shares' },
          periodSaves: { $sum: '$saves' },
          periodClicks: { $sum: '$clicks' },
          periodWatchTime: { $sum: '$videoWatchTime' },
        },
      },
    ]);
    const periodMap = {};
    periodAnalytics.forEach(p => { periodMap[p._id.toString()] = p; });

    // Merge and build result
    let result = posts.map(post => {
      const pid = post._id.toString();
      const cm = metricsMap[pid] || {};
      const pa = periodMap[pid] || {};
      return {
        ...post,
        metrics: {
          totalViews: cm.totalViews || post.viewsCount || 0,
          totalLikes: cm.totalLikes || post.likesCount || 0,
          totalComments: cm.totalComments || post.commentsCount || 0,
          totalShares: cm.totalShares || post.sharesCount || 0,
          totalSaves: cm.totalSaves || post.savesCount || 0,
          engagementRate: cm.engagementRate || 0,
          clickThroughRate: cm.clickThroughRate || 0,
          performanceScore: cm.performanceScore || 0,
          performanceTier: cm.performanceTier || 'low',
          totalWatchTime: cm.totalWatchTime || 0,
          averageWatchTime: cm.averageWatchTime || 0,
        },
        periodMetrics: {
          views: pa.periodViews || 0,
          likes: pa.periodLikes || 0,
          comments: pa.periodComments || 0,
          shares: pa.periodShares || 0,
          saves: pa.periodSaves || 0,
          clicks: pa.periodClicks || 0,
          watchTime: pa.periodWatchTime || 0,
        },
        trend: cm.viewsTrend || [],
        engagementTrend: cm.engagementTrend || [],
      };
    });

    // Sort
    const sortDir = sortOrder === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      const aVal = a.metrics[sortBy] || 0;
      const bVal = b.metrics[sortBy] || 0;
      return (bVal - aVal) * sortDir;
    });

    // Paginate
    const total = result.length;
    const startIdx = (page - 1) * limit;
    result = result.slice(startIdx, startIdx + limit);

    // Aggregate totals
    const aggregateTotals = metrics.reduce((acc, m) => ({
      totalViews: acc.totalViews + (m.totalViews || 0),
      totalLikes: acc.totalLikes + (m.totalLikes || 0),
      totalComments: acc.totalComments + (m.totalComments || 0),
      totalShares: acc.totalShares + (m.totalShares || 0),
      avgEngagement: 0,
    }), { totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0, avgEngagement: 0 });

    if (metrics.length > 0) {
      aggregateTotals.avgEngagement = metrics.reduce((s, m) => s + (m.engagementRate || 0), 0) / metrics.length;
    }

    return {
      posts: result,
      totals: aggregateTotals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get the performance heatmap (day-of-week × hour-of-day engagement).
   */
  static async getPerformanceHeatmap(creatorId, period = '30d') {
    const { startDate, endDate } = this._getPeriodDates(period);

    const events = await PostEvent.aggregate([
      {
        $match: {
          ownerId: creatorId,
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: '$timestamp' },
            hour: { $hour: '$timestamp' },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Build 7×24 heatmap matrix
    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
    events.forEach(e => {
      const day = e._id.dayOfWeek - 1; // 0=Sun
      const hour = e._id.hour;
      heatmap[day][hour] = e.count;
    });

    return { heatmap, period };
  }

  /**
   * Engagement trends over time for content.
   */
  static async getEngagementTrends(creatorId, period = '30d') {
    const { startDate, endDate } = this._getPeriodDates(period);

    const daily = await PostAnalyticsDaily.aggregate([
      {
        $match: {
          creator: creatorId,
          date: {
            $gte: startDate.toISOString().split('T')[0],
            $lte: endDate.toISOString().split('T')[0],
          },
        },
      },
      {
        $group: {
          _id: '$date',
          views: { $sum: '$views' },
          likes: { $sum: '$likes' },
          comments: { $sum: '$comments' },
          shares: { $sum: '$shares' },
          saves: { $sum: '$saves' },
          engagementRate: { $avg: '$engagementRate' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return daily.map(d => ({
      date: d._id,
      views: d.views,
      likes: d.likes,
      comments: d.comments,
      shares: d.shares,
      saves: d.saves,
      engagementRate: Math.round(d.engagementRate * 100) / 100,
    }));
  }

  // ─── AUDIENCE INSIGHTS ───────────────────────────────────────

  /**
   * Comprehensive audience insights.
   */
  static async getAudienceInsights(creatorId, period = '30d') {
    const cacheKey = `dashboard:audience:${creatorId}:${period}`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (_) {}

    const { startDate, endDate } = this._getPeriodDates(period);

    const [
      latestDemographic,
      followerGrowth,
      engagementByDevice,
      trafficSources,
      activeHoursData,
      followerStats,
    ] = await Promise.all([
      AudienceDemographic.findOne({ creator: creatorId })
        .sort({ date: -1 })
        .lean(),
      this._getFollowerGrowthTimeline(creatorId, startDate, endDate),
      this._getDeviceBreakdown(creatorId, startDate, endDate),
      this._getTrafficSources(creatorId, startDate, endDate),
      this._getActiveHours(creatorId, startDate, endDate),
      this._getFollowerStats(creatorId),
    ]);

    const result = {
      demographics: {
        ageGroups: latestDemographic?.ageGroups || {},
        genderDistribution: latestDemographic?.genderDistribution || {},
        countries: latestDemographic?.countries || [],
        cities: latestDemographic?.cities || [],
      },
      engagement: {
        segments: latestDemographic?.engagementSegments || {},
        followerRate: latestDemographic?.followerEngagementRate || 0,
        nonFollowerRate: latestDemographic?.nonFollowerEngagementRate || 0,
        ratio: latestDemographic?.followerToNonFollowerRatio || 0,
        devices: engagementByDevice,
        trafficSources,
      },
      activity: {
        activeHours: activeHoursData,
        activeDays: latestDemographic?.activeDays ? Object.fromEntries(latestDemographic.activeDays) : {},
        peakHour: this._findPeakHour(activeHoursData),
      },
      followers: {
        ...followerStats,
        growthTimeline: followerGrowth,
      },
      viewers: {
        newViewers: latestDemographic?.newViewers || 0,
        returningViewers: latestDemographic?.returningViewers || 0,
      },
    };

    try {
      await redisClient.setex(cacheKey, 600, JSON.stringify(result)); // 10 min
    } catch (_) {}

    return result;
  }

  // ─── MONETIZATION ────────────────────────────────────────────

  /**
   * Complete monetization dashboard data.
   */
  static async getMonetizationData(creatorId, period = '30d') {
    const cacheKey = `dashboard:monetization:${creatorId}:${period}`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (_) {}

    const { startDate, endDate, prevStart, prevEnd } = this._getPeriodDates(period);

    const [
      creatorProfile,
      currentRevenue,
      previousRevenue,
      revenueByType,
      revenueTimeline,
      payoutHistory,
      wallet,
      topEarningPosts,
      recentDonations,
      subscriberCount,
    ] = await Promise.all([
      CreatorProfile.findOne({ user: creatorId }).lean(),
      CreatorRevenue.aggregate([
        { $match: { creator: creatorId, createdAt: { $gte: startDate, $lte: endDate }, status: { $in: ['approved', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$netAmount' }, count: { $sum: 1 } } },
      ]),
      CreatorRevenue.aggregate([
        { $match: { creator: creatorId, createdAt: { $gte: prevStart, $lte: prevEnd }, status: { $in: ['approved', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$netAmount' } } },
      ]),
      CreatorRevenue.aggregate([
        { $match: { creator: creatorId, createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$type', total: { $sum: '$netAmount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      CreatorRevenue.aggregate([
        { $match: { creator: creatorId, createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            amount: { $sum: '$netAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      CreatorRevenue.find({ creator: creatorId, status: 'paid' })
        .sort({ paidAt: -1 })
        .limit(20)
        .lean(),
      Wallet.findOne({ user: creatorId }).lean(),
      this._getTopEarningPosts(creatorId, startDate, endDate, 10),
      CreatorRevenue.find({
        creator: creatorId,
        type: { $in: ['donation', 'tip'] },
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('donor', 'username avatar displayName')
        .lean(),
      CreatorRevenue.countDocuments({
        creator: creatorId,
        type: 'subscription',
        status: { $in: ['approved', 'paid'] },
      }),
    ]);

    const currentTotal = currentRevenue[0]?.total || 0;
    const previousTotal = previousRevenue[0]?.total || 0;

    const result = {
      profile: {
        monetizationEnabled: creatorProfile?.monetizationEnabled || false,
        monetizationTier: creatorProfile?.monetizationTier || 'starter',
        enabledStreams: {
          adRevenue: creatorProfile?.adRevenueEnabled || false,
          sponsorship: creatorProfile?.sponsorshipEnabled || false,
          donations: creatorProfile?.donationsEnabled || false,
          tips: creatorProfile?.tipsEnabled || false,
          subscriptions: creatorProfile?.subscriptionEnabled || false,
          premiumContent: creatorProfile?.premiumContentEnabled || false,
          affiliate: creatorProfile?.affiliateEnabled || false,
        },
      },
      earnings: {
        totalRevenue: currentTotal,
        revenueGrowth: this._calcGrowth(currentTotal, previousTotal),
        transactionCount: currentRevenue[0]?.count || 0,
        revenueByType: revenueByType.map(r => ({
          type: r._id,
          total: r.total,
          count: r.count,
        })),
        revenuePerPost: currentTotal / (Math.max(currentRevenue[0]?.count || 1, 1)),
      },
      timeline: revenueTimeline.map(t => ({
        date: t._id,
        amount: t.amount,
        transactions: t.count,
      })),
      payouts: {
        history: payoutHistory,
        pendingBalance: creatorProfile?.pendingBalance || wallet?.balance || 0,
        lifetimePayouts: creatorProfile?.lifetimePayouts || 0,
        lifetimeRevenue: creatorProfile?.lifetimeRevenue || 0,
      },
      wallet: {
        balance: wallet?.balance || 0,
        totalDeposits: wallet?.totalDeposits || 0,
        totalWithdrawals: wallet?.totalWithdrawals || 0,
      },
      topEarningPosts,
      recentDonations,
      subscriberCount,
      period,
    };

    try {
      await redisClient.setex(cacheKey, 300, JSON.stringify(result)); // 5 min
    } catch (_) {}

    return result;
  }

  // ─── CONTENT MANAGEMENT ──────────────────────────────────────

  /**
   * Get content management console data.
   */
  static async getContentManagement(creatorId, {
    page = 1,
    limit = 20,
    status,
    mediaType,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = {}) {
    const filter = { user: creatorId };
    if (status) filter.status = status;
    if (mediaType) filter.mediaType = mediaType;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [posts, total, scheduled, statusCounts] = await Promise.all([
      Post.find(filter)
        .select('title slug mediaType image video status isPinned isOriginal createdAt updatedAt likesCount commentsCount viewsCount sharesCount savesCount tags category')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
      ScheduledPost.find({ creator: creatorId, status: 'scheduled' })
        .populate('post', 'title slug mediaType image')
        .sort({ scheduledFor: 1 })
        .lean(),
      Post.aggregate([
        { $match: { user: creatorId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    // Enrich with comment counts
    const postIds = posts.map(p => p._id);
    const commentCounts = await Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: '$post', count: { $sum: 1 } } },
    ]);
    const commentMap = {};
    commentCounts.forEach(c => { commentMap[c._id.toString()] = c.count; });

    const enrichedPosts = posts.map(p => ({
      ...p,
      actualCommentCount: commentMap[p._id.toString()] || p.commentsCount || 0,
    }));

    const statusMap = {};
    statusCounts.forEach(s => { statusMap[s._id] = s.count; });

    return {
      posts: enrichedPosts,
      scheduled,
      statusSummary: {
        published: statusMap.published || 0,
        draft: statusMap.draft || 0,
        pending: statusMap.pending || 0,
        archived: statusMap.archived || 0,
        rejected: statusMap.rejected || 0,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    };
  }

  /**
   * Schedule a post for future publishing.
   */
  static async schedulePost(creatorId, postId, scheduledFor, options = {}) {
    const post = await Post.findOne({ _id: postId, user: creatorId });
    if (!post) throw new Error('Post not found or not owned by creator');

    // Set post status to draft if not already
    if (post.status !== 'draft') {
      post.status = 'draft';
      await post.save();
    }

    const scheduled = await ScheduledPost.create({
      creator: creatorId,
      post: postId,
      scheduledFor: new Date(scheduledFor),
      timezone: options.timezone || 'UTC',
      recurring: options.recurring || false,
      recurrencePattern: options.recurrencePattern,
      recurrenceEndDate: options.recurrenceEndDate,
      notes: options.notes,
    });

    return scheduled;
  }

  /**
   * Cancel a scheduled post.
   */
  static async cancelScheduledPost(creatorId, scheduledId) {
    const scheduled = await ScheduledPost.findOneAndUpdate(
      { _id: scheduledId, creator: creatorId, status: 'scheduled' },
      { status: 'cancelled' },
      { new: true }
    );
    if (!scheduled) throw new Error('Scheduled post not found');
    return scheduled;
  }

  /**
   * Pin/unpin a post.
   */
  static async togglePinPost(creatorId, postId) {
    const post = await Post.findOne({ _id: postId, user: creatorId });
    if (!post) throw new Error('Post not found');
    post.isPinned = !post.isPinned;
    await post.save();
    return { isPinned: post.isPinned };
  }

  /**
   * Bulk update post status.
   */
  static async bulkUpdatePosts(creatorId, postIds, action) {
    const validActions = {
      archive: { status: 'archived' },
      publish: { status: 'published' },
      draft: { status: 'draft' },
      delete: null, // soft delete
    };

    if (!validActions.hasOwnProperty(action)) {
      throw new Error('Invalid action');
    }

    if (action === 'delete') {
      const result = await Post.updateMany(
        { _id: { $in: postIds }, user: creatorId },
        { isDeleted: true, deletedAt: new Date() }
      );
      return { modifiedCount: result.modifiedCount };
    }

    const result = await Post.updateMany(
      { _id: { $in: postIds }, user: creatorId },
      validActions[action]
    );
    return { modifiedCount: result.modifiedCount };
  }

  // ─── AI / GROWTH INSIGHTS ───────────────────────────────────

  /**
   * AI-powered growth recommendations.
   */
  static async getGrowthInsights(creatorId) {
    const cacheKey = `dashboard:ai:${creatorId}`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (_) {}

    const [
      bestTimes,
      contentTypePerformance,
      tagPerformance,
      growthTrend,
      engagementPatterns,
      audienceData,
    ] = await Promise.all([
      this._analyzeBestPostingTimes(creatorId),
      this._analyzeContentTypePerformance(creatorId),
      this._analyzeTagPerformance(creatorId),
      this._analyzeGrowthTrend(creatorId),
      this._analyzeEngagementPatterns(creatorId),
      AudienceDemographic.findOne({ creator: creatorId }).sort({ date: -1 }).lean(),
    ]);

    // Generate AI-style recommendations
    const recommendations = this._generateRecommendations({
      bestTimes,
      contentTypePerformance,
      tagPerformance,
      growthTrend,
      engagementPatterns,
    });

    // Trending topics based on top tags in the platform
    const trendingTopics = await this._getTrendingTopics();

    // Performance prediction
    const prediction = this._predictGrowth(growthTrend);

    const result = {
      bestPostingTimes: bestTimes,
      contentTypePerformance,
      tagPerformance,
      trendingTopics,
      growthPrediction: prediction,
      recommendations,
      engagementPatterns,
      audienceSummary: {
        topCountry: audienceData?.countries?.[0]?.name || 'Unknown',
        peakDay: this._findPeakDay(audienceData?.activeDays),
        topDevice: this._findTopDevice(audienceData?.devices),
      },
    };

    try {
      await redisClient.setex(cacheKey, 900, JSON.stringify(result)); // 15 min
    } catch (_) {}

    return result;
  }

  // ─── ACTIVITY FEED ───────────────────────────────────────────

  /**
   * Real-time activity feed for the creator.
   */
  static async getActivityFeed(creatorId, { page = 1, limit = 30, eventType } = {}) {
    const filter = { creator: creatorId };
    if (eventType) filter.eventType = eventType;

    const skip = (page - 1) * limit;

    const [events, total, unreadCount] = await Promise.all([
      ActivityEvent.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityEvent.countDocuments(filter),
      ActivityEvent.countDocuments({ ...filter, isRead: false }),
    ]);

    return {
      events,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark activity events as read.
   */
  static async markActivityRead(creatorId, eventIds) {
    if (eventIds === 'all') {
      await ActivityEvent.updateMany(
        { creator: creatorId, isRead: false },
        { isRead: true }
      );
    } else {
      await ActivityEvent.updateMany(
        { _id: { $in: eventIds }, creator: creatorId },
        { isRead: true }
      );
    }
    return { success: true };
  }

  // ─── CREATOR PROFILE / SETTINGS ──────────────────────────────

  /**
   * Get or create the creator profile.
   */
  static async getCreatorProfile(creatorId) {
    let profile = await CreatorProfile.findOne({ user: creatorId }).lean();
    if (!profile) {
      profile = await CreatorProfile.create({
        user: creatorId,
        isCreator: true,
        creatorSince: new Date(),
      });
      profile = profile.toObject();
    }
    return profile;
  }

  /**
   * Update creator profile settings.
   */
  static async updateCreatorProfile(creatorId, updates) {
    const allowedFields = [
      'monetizationEnabled', 'adRevenueEnabled', 'sponsorshipEnabled',
      'donationsEnabled', 'tipsEnabled', 'subscriptionEnabled',
      'premiumContentEnabled', 'affiliateEnabled', 'payoutMethod',
      'payoutDetails', 'minimumPayout', 'payoutSchedule',
      'subscriptionTiers', 'autoModeration', 'commentFilter',
      'spamDetection', 'dashboardLayout', 'emailReports',
      'notificationPreferences', 'goals',
    ];

    const safeUpdates = {};
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) safeUpdates[field] = updates[field];
    });

    const profile = await CreatorProfile.findOneAndUpdate(
      { user: creatorId },
      { $set: safeUpdates },
      { new: true, upsert: true }
    );

    return profile;
  }

  /**
   * Enable monetization for a creator.
   */
  static async enableMonetization(creatorId) {
    const user = await User.findById(creatorId);
    if (!user) throw new Error('User not found');

    // Check eligibility (minimum requirements)
    if (user.followersCount < 100) {
      throw new Error('Need at least 100 followers to enable monetization');
    }

    const profile = await CreatorProfile.findOneAndUpdate(
      { user: creatorId },
      {
        $set: {
          monetizationEnabled: true,
          monetizationEnabledAt: new Date(),
          isCreator: true,
        },
      },
      { new: true, upsert: true }
    );

    // Ensure wallet exists
    await Wallet.findOneAndUpdate(
      { user: creatorId },
      { $setOnInsert: { user: creatorId, balance: 0, totalDeposits: 0, totalWithdrawals: 0 } },
      { upsert: true }
    );

    return profile;
  }

  // ─── COMMENT MODERATION ──────────────────────────────────────

  /**
   * Get comments on creator's content for moderation.
   */
  static async getCommentsForModeration(creatorId, { page = 1, limit = 30, filter = 'all' } = {}) {
    // Get all post IDs by this creator
    const postIds = await Post.find({ user: creatorId })
      .select('_id')
      .lean()
      .then(posts => posts.map(p => p._id));

    const commentFilter = { post: { $in: postIds } };
    if (filter === 'spam') commentFilter.isSpam = true;
    if (filter === 'reported') commentFilter.isReported = true;

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find(commentFilter)
        .populate('user', 'username avatar displayName')
        .populate('post', 'title slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments(commentFilter),
    ]);

    return {
      comments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    };
  }

  /**
   * Moderate a comment (approve, hide, delete).
   */
  static async moderateComment(creatorId, commentId, action) {
    const comment = await Comment.findById(commentId).populate('post', 'user');
    if (!comment || comment.post.user.toString() !== creatorId.toString()) {
      throw new Error('Comment not found or unauthorized');
    }

    switch (action) {
      case 'approve':
        comment.isSpam = false;
        comment.isReported = false;
        break;
      case 'hide':
        comment.isHidden = true;
        break;
      case 'delete':
        await Comment.findByIdAndDelete(commentId);
        return { deleted: true };
      default:
        throw new Error('Invalid moderation action');
    }

    await comment.save();
    return comment;
  }

  // ─── PRIVATE HELPERS ─────────────────────────────────────────

  static _getPeriodDates(period) {
    const now = new Date();
    const endDate = new Date(now);
    let startDate, prevStart, prevEnd;

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        prevEnd = new Date(startDate);
        prevStart = new Date(prevEnd);
        prevStart.setDate(prevStart.getDate() - 1);
        break;
      case '7d':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        prevEnd = new Date(startDate);
        prevStart = new Date(prevEnd);
        prevStart.setDate(prevStart.getDate() - 7);
        break;
      case '90d':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 90);
        prevEnd = new Date(startDate);
        prevStart = new Date(prevEnd);
        prevStart.setDate(prevStart.getDate() - 90);
        break;
      case '30d':
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        prevEnd = new Date(startDate);
        prevStart = new Date(prevEnd);
        prevStart.setDate(prevStart.getDate() - 30);
        break;
    }

    return { startDate, endDate: new Date(), prevStart, prevEnd };
  }

  static _calcGrowth(current, previous) {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }

  static async _aggregateSnapshots(creatorId, startDate, endDate) {
    const result = await CreatorAnalyticsSnapshot.aggregate([
      {
        $match: {
          creator: creatorId,
          date: {
            $gte: startDate.toISOString().split('T')[0],
            $lte: endDate.toISOString().split('T')[0],
          },
        },
      },
      {
        $group: {
          _id: null,
          impressions: { $sum: '$impressions' },
          engagementRate: { $avg: '$engagementRate' },
          profileVisits: { $sum: '$profileVisits' },
          newFollowers: { $sum: '$newFollowers' },
          totalLikes: { $sum: '$totalLikes' },
          totalComments: { $sum: '$totalComments' },
          totalShares: { $sum: '$totalShares' },
        },
      },
    ]);

    return result[0] || {
      impressions: 0,
      engagementRate: 0,
      profileVisits: 0,
      newFollowers: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
    };
  }

  static async _getRevenueStats(creatorId, startDate, endDate) {
    const [current, previous] = await Promise.all([
      CreatorRevenue.aggregate([
        {
          $match: {
            creator: creatorId,
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['approved', 'paid'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$netAmount' } } },
      ]),
      CreatorRevenue.aggregate([
        {
          $match: {
            creator: creatorId,
            createdAt: {
              $gte: new Date(startDate.getTime() - (endDate - startDate)),
              $lte: startDate,
            },
            status: { $in: ['approved', 'paid'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$netAmount' } } },
      ]),
    ]);

    return {
      totalRevenue: current[0]?.total || 0,
      prevRevenue: previous[0]?.total || 0,
    };
  }

  static async _getTopPerformingPosts(creatorId, limit = 5) {
    return ContentMetrics.find({ creator: creatorId })
      .sort({ performanceScore: -1 })
      .limit(limit)
      .populate('post', 'title slug mediaType image video thumbnails createdAt')
      .lean();
  }

  static async _getTopEarningPosts(creatorId, startDate, endDate, limit = 10) {
    return CreatorRevenue.aggregate([
      {
        $match: {
          creator: creatorId,
          post: { $exists: true, $ne: null },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$post',
          totalRevenue: { $sum: '$netAmount' },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: '_id',
          as: 'post',
        },
      },
      { $unwind: '$post' },
      {
        $project: {
          'post.title': 1,
          'post.slug': 1,
          'post.mediaType': 1,
          'post.image.thumbnailUrl': 1,
          totalRevenue: 1,
          transactions: 1,
        },
      },
    ]);
  }

  static async _getRealtimeCounters(creatorId) {
    try {
      const [views, engagement, liveViewers] = await Promise.all([
        redisClient.hget(`creator:realtime:${creatorId}`, 'views'),
        redisClient.hget(`creator:realtime:${creatorId}`, 'engagement'),
        redisClient.scard(`creator:live_viewers:${creatorId}`),
      ]);
      return {
        liveViews: parseInt(views) || 0,
        liveEngagement: parseInt(engagement) || 0,
        liveViewers: liveViewers || 0,
      };
    } catch (_) {
      return { liveViews: 0, liveEngagement: 0, liveViewers: 0 };
    }
  }

  static async _getFollowerGrowthTimeline(creatorId, startDate, endDate) {
    return CreatorAnalyticsSnapshot.find({
      creator: creatorId,
      date: {
        $gte: startDate.toISOString().split('T')[0],
        $lte: endDate.toISOString().split('T')[0],
      },
    })
      .select('date totalFollowers newFollowers lostFollowers')
      .sort({ date: 1 })
      .lean();
  }

  static async _getDeviceBreakdown(creatorId, startDate, endDate) {
    const result = await PostEvent.aggregate([
      {
        $match: {
          ownerId: creatorId,
          timestamp: { $gte: startDate, $lte: endDate },
          deviceType: { $exists: true },
        },
      },
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 },
        },
      },
    ]);

    const total = result.reduce((s, r) => s + r.count, 0);
    return result.map(r => ({
      device: r._id,
      count: r.count,
      percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
    }));
  }

  static async _getTrafficSources(creatorId, startDate, endDate) {
    const result = await PostEvent.aggregate([
      {
        $match: {
          ownerId: creatorId,
          timestamp: { $gte: startDate, $lte: endDate },
          source: { $exists: true },
        },
      },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const total = result.reduce((s, r) => s + r.count, 0);
    return result.map(r => ({
      source: r._id,
      count: r.count,
      percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
    }));
  }

  static async _getActiveHours(creatorId, startDate, endDate) {
    const result = await PostEvent.aggregate([
      {
        $match: {
          ownerId: creatorId,
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const hours = {};
    for (let i = 0; i < 24; i++) hours[i] = 0;
    result.forEach(r => { hours[r._id] = r.count; });
    return hours;
  }

  static async _getFollowerStats(creatorId) {
    const user = await User.findById(creatorId).select('followersCount followingCount');
    const recentFollows = await Follow.countDocuments({
      following: creatorId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });
    const recentUnfollows = await Follow.countDocuments({
      following: creatorId,
      unfollowedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }).catch(() => 0);

    return {
      totalFollowers: user?.followersCount || 0,
      totalFollowing: user?.followingCount || 0,
      recentGain: recentFollows,
      recentLost: recentUnfollows,
      netGrowth: recentFollows - recentUnfollows,
    };
  }

  static _findPeakHour(hoursData) {
    if (!hoursData || typeof hoursData !== 'object') return 12;
    let maxHour = 0;
    let maxVal = 0;
    Object.entries(hoursData).forEach(([hour, val]) => {
      if (val > maxVal) { maxVal = val; maxHour = parseInt(hour); }
    });
    return maxHour;
  }

  static _findPeakDay(activeDays) {
    if (!activeDays) return 'Monday';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let maxDay = 0;
    let maxVal = 0;
    const entries = activeDays instanceof Map ? Array.from(activeDays.entries()) : Object.entries(activeDays);
    entries.forEach(([day, val]) => {
      if (val > maxVal) { maxVal = val; maxDay = parseInt(day); }
    });
    return days[maxDay] || 'Monday';
  }

  static _findTopDevice(devices) {
    if (!devices) return 'mobile';
    let top = 'mobile';
    let max = 0;
    Object.entries(devices).forEach(([d, v]) => {
      if (v > max) { max = v; top = d; }
    });
    return top;
  }

  static async _analyzeBestPostingTimes(creatorId) {
    const result = await PostAnalyticsDaily.aggregate([
      { $match: { creator: creatorId } },
      {
        $lookup: {
          from: 'posts',
          localField: 'post',
          foreignField: '_id',
          as: 'postData',
        },
      },
      { $unwind: '$postData' },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: '$postData.createdAt' },
            hour: { $hour: '$postData.createdAt' },
          },
          avgEngagement: { $avg: '$engagementRate' },
          avgViews: { $avg: '$views' },
          postCount: { $sum: 1 },
        },
      },
      { $sort: { avgEngagement: -1 } },
      { $limit: 10 },
    ]);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return result.map(r => ({
      day: days[r._id.dayOfWeek - 1],
      hour: r._id.hour,
      avgEngagement: Math.round(r.avgEngagement * 100) / 100,
      avgViews: Math.round(r.avgViews),
      postCount: r.postCount,
    }));
  }

  static async _analyzeContentTypePerformance(creatorId) {
    return Post.aggregate([
      { $match: { user: creatorId, status: 'published' } },
      {
        $group: {
          _id: '$mediaType',
          avgViews: { $avg: '$viewsCount' },
          avgLikes: { $avg: '$likesCount' },
          avgComments: { $avg: '$commentsCount' },
          totalPosts: { $sum: 1 },
        },
      },
    ]);
  }

  static async _analyzeTagPerformance(creatorId) {
    return Post.aggregate([
      { $match: { user: creatorId, status: 'published', tags: { $exists: true, $ne: [] } } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          avgViews: { $avg: '$viewsCount' },
          avgEngagement: {
            $avg: {
              $cond: [
                { $gt: ['$viewsCount', 0] },
                {
                  $multiply: [
                    { $divide: [{ $add: ['$likesCount', '$commentsCount', '$sharesCount'] }, '$viewsCount'] },
                    100,
                  ],
                },
                0,
              ],
            },
          },
          postCount: { $sum: 1 },
        },
      },
      { $sort: { avgEngagement: -1 } },
      { $limit: 15 },
    ]);
  }

  static async _analyzeGrowthTrend(creatorId) {
    return CreatorAnalyticsSnapshot.find({ creator: creatorId })
      .select('date totalFollowers impressions engagementRate')
      .sort({ date: -1 })
      .limit(90)
      .lean();
  }

  static async _analyzeEngagementPatterns(creatorId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return PostEvent.aggregate([
      {
        $match: {
          ownerId: creatorId,
          timestamp: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  static async _getTrendingTopics() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return Post.aggregate([
      {
        $match: {
          status: 'published',
          createdAt: { $gte: sevenDaysAgo },
          tags: { $exists: true, $ne: [] },
        },
      },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          postCount: { $sum: 1 },
          avgViews: { $avg: '$viewsCount' },
          avgEngagement: { $avg: '$likesCount' },
        },
      },
      { $sort: { postCount: -1, avgViews: -1 } },
      { $limit: 20 },
    ]);
  }

  static _generateRecommendations({ bestTimes, contentTypePerformance, tagPerformance, growthTrend, engagementPatterns }) {
    const recommendations = [];

    // Best time recommendation
    if (bestTimes.length > 0) {
      const top = bestTimes[0];
      recommendations.push({
        type: 'posting_time',
        priority: 'high',
        title: 'Optimal Posting Time',
        description: `Your audience is most engaged on ${top.day} at ${top.hour}:00. Posts at this time get ${top.avgViews} views on average.`,
        icon: 'clock',
      });
    }

    // Content type recommendation
    if (contentTypePerformance.length > 0) {
      const sorted = [...contentTypePerformance].sort((a, b) => b.avgViews - a.avgViews);
      const best = sorted[0];
      if (best) {
        recommendations.push({
          type: 'content_type',
          priority: 'high',
          title: 'Best Performing Content Type',
          description: `${best._id} content performs best with avg ${Math.round(best.avgViews)} views per post. Consider creating more ${best._id} content.`,
          icon: 'trending-up',
        });
      }
    }

    // Tag recommendation
    if (tagPerformance.length > 0) {
      const topTags = tagPerformance.slice(0, 3).map(t => `#${t._id}`);
      recommendations.push({
        type: 'tags',
        priority: 'medium',
        title: 'High-Performing Tags',
        description: `Use ${topTags.join(', ')} — these tags drive the most engagement for your content.`,
        icon: 'hash',
      });
    }

    // Growth trend recommendation
    if (growthTrend.length >= 7) {
      const recent = growthTrend.slice(0, 7);
      const older = growthTrend.slice(7, 14);
      const recentAvg = recent.reduce((s, d) => s + (d.impressions || 0), 0) / recent.length;
      const olderAvg = older.length > 0 ? older.reduce((s, d) => s + (d.impressions || 0), 0) / older.length : 0;

      if (recentAvg > olderAvg * 1.2) {
        recommendations.push({
          type: 'growth',
          priority: 'info',
          title: 'Growth Momentum',
          description: 'Your reach is growing! Keep posting consistently to maintain this upward trend.',
          icon: 'rocket',
        });
      } else if (recentAvg < olderAvg * 0.8) {
        recommendations.push({
          type: 'growth',
          priority: 'high',
          title: 'Engagement Declining',
          description: 'Your reach has dropped recently. Try experimenting with new content formats or posting at different times.',
          icon: 'alert-triangle',
        });
      }
    }

    // Engagement pattern recommendation
    if (engagementPatterns.length > 0) {
      const viewEvents = engagementPatterns.find(e => e._id === 'view');
      const likeEvents = engagementPatterns.find(e => e._id === 'like');
      if (viewEvents && likeEvents) {
        const likeRatio = (likeEvents.count / viewEvents.count) * 100;
        if (likeRatio < 3) {
          recommendations.push({
            type: 'engagement',
            priority: 'medium',
            title: 'Increase Engagement CTAs',
            description: `Only ${likeRatio.toFixed(1)}% of viewers engage. Add clear calls-to-action in your content to boost interaction.`,
            icon: 'message-circle',
          });
        }
      }
    }

    // Consistency recommendation
    recommendations.push({
      type: 'consistency',
      priority: 'medium',
      title: 'Post Consistently',
      description: 'Creators who post 3-5 times per week see 2x more follower growth. Maintain a consistent schedule.',
      icon: 'calendar',
    });

    return recommendations;
  }

  static _predictGrowth(trend) {
    if (!trend || trend.length < 7) {
      return { prediction: 'insufficient_data', confidence: 0 };
    }

    const recentFollowers = trend.slice(0, 7).map(t => t.totalFollowers || 0);
    const avgGrowth = recentFollowers.length > 1
      ? (recentFollowers[0] - recentFollowers[recentFollowers.length - 1]) / recentFollowers.length
      : 0;

    const predicted30d = Math.round((recentFollowers[0] || 0) + avgGrowth * 30);
    const predicted90d = Math.round((recentFollowers[0] || 0) + avgGrowth * 90);

    let trajectory = 'stable';
    if (avgGrowth > 5) trajectory = 'growing';
    if (avgGrowth > 20) trajectory = 'accelerating';
    if (avgGrowth < -5) trajectory = 'declining';

    return {
      currentFollowers: recentFollowers[0] || 0,
      dailyGrowthRate: Math.round(avgGrowth * 10) / 10,
      predicted30d,
      predicted90d,
      trajectory,
      confidence: Math.min(trend.length / 30, 1) * 100,
    };
  }
}

module.exports = CreatorDashboardService;

const Post = require('../models/Post');
const ContentMetrics = require('../models/ContentMetrics');
const PostAnalyticsDaily = require('../models/PostAnalyticsDaily');
const AudienceDemographic = require('../models/AudienceDemographic');
const PostEvent = require('../models/PostEvent');
const CreatorAnalyticsSnapshot = require('../models/CreatorAnalyticsSnapshot');
const { Follow } = require('../models/Interaction');
const User = require('../models/User');

/**
 * ContentMetricsWorker — Aggregates raw analytics into ContentMetrics and AudienceDemographic records.
 * Runs daily alongside the existing analyticsWorker.
 */
class ContentMetricsWorker {

  /**
   * Aggregate content metrics for all active posts.
   * Should run daily after analyticsWorker completes.
   */
  static async aggregateContentMetrics() {
    console.log('[ContentMetricsWorker] Starting content metrics aggregation...');
    const startTime = Date.now();

    try {
      // Get all published posts (batch process)
      const batchSize = 100;
      let skip = 0;
      let processed = 0;

      while (true) {
        const posts = await Post.find({ status: 'published' })
          .select('_id user viewsCount likesCount commentsCount sharesCount savesCount mediaType createdAt')
          .skip(skip)
          .limit(batchSize)
          .lean();

        if (posts.length === 0) break;

        const bulkOps = [];

        for (const post of posts) {
          try {
            const metrics = await this._computePostMetrics(post);
            bulkOps.push({
              updateOne: {
                filter: { post: post._id },
                update: { $set: metrics },
                upsert: true,
              },
            });
          } catch (err) {
            console.error(`[ContentMetricsWorker] Error computing metrics for post ${post._id}:`, err.message);
          }
        }

        if (bulkOps.length > 0) {
          await ContentMetrics.bulkWrite(bulkOps);
          processed += bulkOps.length;
        }

        skip += batchSize;
      }

      console.log(`[ContentMetricsWorker] Aggregated metrics for ${processed} posts in ${Date.now() - startTime}ms`);
    } catch (err) {
      console.error('[ContentMetricsWorker] Aggregation failed:', err.message);
    }
  }

  /**
   * Aggregate audience demographics for all creators with recent activity.
   */
  static async aggregateAudienceDemographics() {
    console.log('[ContentMetricsWorker] Starting audience demographic aggregation...');
    const startTime = Date.now();

    try {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Find creators with recent post events
      const activeCreators = await PostEvent.distinct('ownerId', {
        timestamp: { $gte: thirtyDaysAgo },
      });

      let processed = 0;

      for (const creatorId of activeCreators) {
        try {
          const demographics = await this._computeAudienceDemographics(creatorId, thirtyDaysAgo);

          await AudienceDemographic.findOneAndUpdate(
            { creator: creatorId, date: today },
            { $set: demographics },
            { upsert: true }
          );

          processed++;
        } catch (err) {
          console.error(`[ContentMetricsWorker] Error computing demographics for creator ${creatorId}:`, err.message);
        }
      }

      console.log(`[ContentMetricsWorker] Aggregated demographics for ${processed} creators in ${Date.now() - startTime}ms`);
    } catch (err) {
      console.error('[ContentMetricsWorker] Demographics aggregation failed:', err.message);
    }
  }

  /**
   * Run all aggregations.
   */
  static async runAll() {
    await this.aggregateContentMetrics();
    await this.aggregateAudienceDemographics();
  }

  // ─── Private Methods ─────────────────────────────────────────

  static async _computePostMetrics(post) {
    // Get all daily analytics for this post
    const dailyData = await PostAnalyticsDaily.find({ post: post._id }).lean();

    // Sum up totals from daily records
    const totals = dailyData.reduce(
      (acc, d) => ({
        totalViews: acc.totalViews + (d.views || 0),
        uniqueViews: acc.uniqueViews + (d.uniqueViewers || 0),
        totalLikes: acc.totalLikes + (d.likes || 0),
        totalComments: acc.totalComments + (d.comments || 0),
        totalShares: acc.totalShares + (d.shares || 0),
        totalSaves: acc.totalSaves + (d.saves || 0),
        totalClicks: acc.totalClicks + (d.clicks || 0),
        totalWatchTime: acc.totalWatchTime + (d.videoWatchTime || 0),
      }),
      { totalViews: 0, uniqueViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0, totalSaves: 0, totalClicks: 0, totalWatchTime: 0 }
    );

    // Use post counters as fallback
    totals.totalViews = Math.max(totals.totalViews, post.viewsCount || 0);
    totals.totalLikes = Math.max(totals.totalLikes, post.likesCount || 0);
    totals.totalComments = Math.max(totals.totalComments, post.commentsCount || 0);

    // Compute rates
    const engagement = totals.totalLikes + totals.totalComments + totals.totalShares + totals.totalSaves;
    const engagementRate = totals.totalViews > 0
      ? Math.round((engagement / totals.totalViews) * 100 * 100) / 100
      : 0;
    const clickThroughRate = totals.totalViews > 0
      ? Math.round((totals.totalClicks / totals.totalViews) * 100 * 100) / 100
      : 0;
    const averageWatchTime = totals.totalViews > 0
      ? Math.round(totals.totalWatchTime / totals.totalViews)
      : 0;

    // Performance score (0-100)
    const performanceScore = this._calcPerformanceScore(totals, engagementRate);
    const performanceTier = this._getPerformanceTier(performanceScore);

    // Trend data (last 7 days)
    const recent7 = dailyData
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7)
      .reverse();

    const viewsTrend = recent7.map(d => ({ date: d.date, value: d.views || 0 }));
    const engagementTrend = recent7.map(d => ({
      date: d.date,
      value: Math.round((d.engagementRate || 0) * 100) / 100,
    }));

    // Hourly distribution
    const hourlyAgg = await PostEvent.aggregate([
      { $match: { postId: post._id } },
      { $group: { _id: { $hour: '$timestamp' }, count: { $sum: 1 } } },
    ]);
    const hourlyDistribution = {};
    hourlyAgg.forEach(h => { hourlyDistribution[h._id] = h.count; });

    return {
      post: post._id,
      creator: post.user,
      ...totals,
      engagementRate,
      clickThroughRate,
      averageWatchTime,
      completionRate: 0, // would need video-specific event data
      performanceScore,
      performanceTier,
      isTopPerforming: performanceScore >= 80,
      viewsTrend,
      engagementTrend,
      hourlyDistribution,
      lastAggregatedAt: new Date(),
    };
  }

  static _calcPerformanceScore(totals, engagementRate) {
    // Weighted composite score
    const viewScore = Math.min(totals.totalViews / 1000, 25);       // max 25 pts
    const engagementScore = Math.min(engagementRate * 5, 30);        // max 30 pts
    const likeScore = Math.min(totals.totalLikes / 100, 15);        // max 15 pts
    const commentScore = Math.min(totals.totalComments / 50, 15);    // max 15 pts
    const shareScore = Math.min(totals.totalShares / 20, 10);       // max 10 pts
    const saveScore = Math.min(totals.totalSaves / 30, 5);          // max 5 pts

    return Math.round(viewScore + engagementScore + likeScore + commentScore + shareScore + saveScore);
  }

  static _getPerformanceTier(score) {
    if (score >= 90) return 'mega-viral';
    if (score >= 70) return 'viral';
    if (score >= 45) return 'good';
    if (score >= 20) return 'average';
    return 'low';
  }

  static async _computeAudienceDemographics(creatorId, since) {
    const [
      deviceBreakdown,
      trafficSources,
      activeHours,
      activeDays,
      geoData,
      followerCount,
    ] = await Promise.all([
      PostEvent.aggregate([
        { $match: { ownerId: creatorId, timestamp: { $gte: since }, deviceType: { $exists: true } } },
        { $group: { _id: '$deviceType', count: { $sum: 1 } } },
      ]),
      PostEvent.aggregate([
        { $match: { ownerId: creatorId, timestamp: { $gte: since }, source: { $exists: true } } },
        { $group: { _id: '$source', count: { $sum: 1 } } },
      ]),
      PostEvent.aggregate([
        { $match: { ownerId: creatorId, timestamp: { $gte: since } } },
        { $group: { _id: { $hour: '$timestamp' }, count: { $sum: 1 } } },
      ]),
      PostEvent.aggregate([
        { $match: { ownerId: creatorId, timestamp: { $gte: since } } },
        { $group: { _id: { $dayOfWeek: '$timestamp' }, count: { $sum: 1 } } },
      ]),
      PostEvent.aggregate([
        { $match: { ownerId: creatorId, timestamp: { $gte: since }, 'location.country': { $exists: true } } },
        { $group: { _id: '$location.country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      User.findById(creatorId).select('followersCount').lean(),
    ]);

    // Process device breakdown
    const devices = { mobile: 0, desktop: 0, tablet: 0 };
    deviceBreakdown.forEach(d => {
      if (devices.hasOwnProperty(d._id)) devices[d._id] = d.count;
    });

    // Process traffic sources
    const trafficSourcesObj = { direct: 0, search: 0, social: 0, referral: 0, email: 0, other: 0 };
    trafficSources.forEach(s => {
      if (trafficSourcesObj.hasOwnProperty(s._id)) {
        trafficSourcesObj[s._id] = s.count;
      } else {
        trafficSourcesObj.other += s.count;
      }
    });

    // Process active hours/days
    const activeHoursMap = {};
    activeHours.forEach(h => { activeHoursMap[h._id] = h.count; });
    const activeDaysMap = {};
    activeDays.forEach(d => { activeDaysMap[d._id - 1] = d.count; }); // 0=Sun

    // Process geo
    const totalGeo = geoData.reduce((s, g) => s + g.count, 0);
    const countries = geoData.map(g => ({
      code: g._id,
      name: g._id,
      count: g.count,
      percentage: totalGeo > 0 ? Math.round((g.count / totalGeo) * 100) : 0,
    }));

    // Simulated age/gender (in production would come from user profiles)
    const ageGroups = {
      '13-17': 5,
      '18-24': 35,
      '25-34': 30,
      '35-44': 18,
      '45-54': 8,
      '55+': 4,
    };
    const genderDistribution = { male: 52, female: 42, other: 4, unknown: 2 };

    return {
      creator: creatorId,
      totalFollowers: followerCount?.followersCount || 0,
      totalProfileVisits: 0,
      ageGroups,
      genderDistribution,
      countries,
      cities: [],
      activeHours: activeHoursMap,
      activeDays: activeDaysMap,
      engagementSegments: {
        superFans: Math.round((followerCount?.followersCount || 0) * 0.05),
        activeFans: Math.round((followerCount?.followersCount || 0) * 0.15),
        casualViewers: Math.round((followerCount?.followersCount || 0) * 0.40),
        dormant: Math.round((followerCount?.followersCount || 0) * 0.40),
      },
      devices,
      trafficSources: trafficSourcesObj,
    };
  }
}

module.exports = ContentMetricsWorker;

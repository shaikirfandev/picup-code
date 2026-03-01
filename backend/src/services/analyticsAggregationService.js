/**
 * Analytics Aggregation Service
 * 
 * Background worker that computes daily aggregations from raw PostEvent data
 * and creates PostAnalyticsDaily + CreatorAnalyticsSnapshot records.
 * 
 * Designed for scale: processes events in parallel per-post batches.
 */
const PostEvent = require('../models/PostEvent');
const PostAnalyticsDaily = require('../models/PostAnalyticsDaily');
const CreatorAnalyticsSnapshot = require('../models/CreatorAnalyticsSnapshot');
const AffiliateClick = require('../models/AffiliateClick');
const Post = require('../models/Post');
const User = require('../models/User');
const { Follow } = require('../models/Interaction');

/**
 * Get date string for yesterday or specific date
 */
function getDateStr(date = null) {
  const d = date ? new Date(date) : new Date();
  if (!date) d.setDate(d.getDate() - 1); // default to yesterday
  return d.toISOString().split('T')[0];
}

function getDateRange(dateStr) {
  const start = new Date(dateStr + 'T00:00:00.000Z');
  const end = new Date(dateStr + 'T23:59:59.999Z');
  return { start, end };
}

// ── Compute Post-Level Daily Analytics ──────────────────────────────────────
async function computePostAnalyticsDaily(dateStr = null) {
  const date = dateStr || getDateStr();
  const { start, end } = getDateRange(date);

  console.log(`📊 Computing post analytics for ${date}...`);

  try {
    // Aggregate events grouped by postId
    const postAggs = await PostEvent.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          isBot: false,
        },
      },
      {
        $group: {
          _id: {
            postId: '$postId',
            ownerId: '$ownerId',
          },
          impressions: {
            $sum: { $cond: [{ $eq: ['$eventType', 'view'] }, 1, 0] },
          },
          uniqueViewers: {
            $addToSet: {
              $cond: [
                { $eq: ['$eventType', 'view'] },
                { $ifNull: ['$viewerId', '$sessionId'] },
                '$$REMOVE',
              ],
            },
          },
          likes: {
            $sum: { $cond: [{ $eq: ['$eventType', 'like'] }, 1, 0] },
          },
          unlikes: {
            $sum: { $cond: [{ $eq: ['$eventType', 'unlike'] }, 1, 0] },
          },
          shares: {
            $sum: { $cond: [{ $eq: ['$eventType', 'share'] }, 1, 0] },
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] },
          },
          saves: {
            $sum: { $cond: [{ $eq: ['$eventType', 'save'] }, 1, 0] },
          },
          unsaves: {
            $sum: { $cond: [{ $eq: ['$eventType', 'unsave'] }, 1, 0] },
          },
          comments: {
            $sum: { $cond: [{ $eq: ['$eventType', 'comment'] }, 1, 0] },
          },
          // Device breakdown
          desktopCount: {
            $sum: { $cond: [{ $eq: ['$deviceType', 'desktop'] }, 1, 0] },
          },
          mobileCount: {
            $sum: { $cond: [{ $eq: ['$deviceType', 'mobile'] }, 1, 0] },
          },
          tabletCount: {
            $sum: { $cond: [{ $eq: ['$deviceType', 'tablet'] }, 1, 0] },
          },
          unknownDeviceCount: {
            $sum: { $cond: [{ $eq: ['$deviceType', 'unknown'] }, 1, 0] },
          },
          // Traffic sources
          homeFeed: {
            $sum: { $cond: [{ $eq: ['$referrer', 'home_feed'] }, 1, 0] },
          },
          searchRef: {
            $sum: { $cond: [{ $eq: ['$referrer', 'search'] }, 1, 0] },
          },
          profileRef: {
            $sum: { $cond: [{ $eq: ['$referrer', 'profile'] }, 1, 0] },
          },
          externalRef: {
            $sum: { $cond: [{ $eq: ['$referrer', 'external'] }, 1, 0] },
          },
          directRef: {
            $sum: { $cond: [{ $eq: ['$referrer', 'direct'] }, 1, 0] },
          },
          notificationRef: {
            $sum: { $cond: [{ $eq: ['$referrer', 'notification'] }, 1, 0] },
          },
          boardRef: {
            $sum: { $cond: [{ $eq: ['$referrer', 'board'] }, 1, 0] },
          },
          unknownRef: {
            $sum: { $cond: [{ $eq: ['$referrer', 'unknown'] }, 1, 0] },
          },
          // Video metrics
          watchDurations: {
            $push: {
              $cond: [
                { $ne: ['$watchDuration', null] },
                '$watchDuration',
                '$$REMOVE',
              ],
            },
          },
          completionRates: {
            $push: {
              $cond: [
                { $ne: ['$completionRate', null] },
                '$completionRate',
                '$$REMOVE',
              ],
            },
          },
          // Geo
          countries: { $push: '$country' },
          // Hourly
          hours: { $push: { $hour: '$createdAt' } },
        },
      },
    ]);

    console.log(`  → Found ${postAggs.length} posts with events`);

    // Process each post aggregation
    const bulkOps = postAggs.map((agg) => {
      const impressions = agg.impressions || 0;
      const uniqueViews = agg.uniqueViewers ? agg.uniqueViewers.filter(Boolean).length : 0;
      const engagements = (agg.likes || 0) + (agg.comments || 0) + (agg.shares || 0) + (agg.saves || 0);
      const ctr = impressions > 0 ? ((agg.clicks || 0) / impressions) * 100 : 0;
      const engagementRate = impressions > 0 ? (engagements / impressions) * 100 : 0;

      // Calculate average watch duration and completion rate
      const avgWatchDuration = agg.watchDurations && agg.watchDurations.length > 0
        ? agg.watchDurations.reduce((a, b) => a + b, 0) / agg.watchDurations.length
        : 0;
      const avgCompletionRate = agg.completionRates && agg.completionRates.length > 0
        ? agg.completionRates.reduce((a, b) => a + b, 0) / agg.completionRates.length
        : 0;

      // Compute top countries
      const countryMap = {};
      (agg.countries || []).filter(Boolean).forEach((c) => {
        countryMap[c] = (countryMap[c] || 0) + 1;
      });
      const topCountries = Object.entries(countryMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([country, count]) => ({ country, count }));

      // Hourly distribution
      const hourlyDistribution = new Array(24).fill(0);
      (agg.hours || []).forEach((h) => {
        if (h >= 0 && h < 24) hourlyDistribution[h]++;
      });

      return {
        updateOne: {
          filter: { postId: agg._id.postId, date },
          update: {
            $set: {
              ownerId: agg._id.ownerId,
              impressions,
              uniqueViews,
              likes: agg.likes || 0,
              unlikes: agg.unlikes || 0,
              shares: agg.shares || 0,
              clicks: agg.clicks || 0,
              saves: agg.saves || 0,
              unsaves: agg.unsaves || 0,
              comments: agg.comments || 0,
              ctr: Math.round(ctr * 100) / 100,
              engagementRate: Math.round(engagementRate * 100) / 100,
              avgWatchDuration: Math.round(avgWatchDuration * 100) / 100,
              avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
              deviceBreakdown: {
                desktop: agg.desktopCount || 0,
                mobile: agg.mobileCount || 0,
                tablet: agg.tabletCount || 0,
                unknown: agg.unknownDeviceCount || 0,
              },
              trafficSources: {
                home_feed: agg.homeFeed || 0,
                search: agg.searchRef || 0,
                profile: agg.profileRef || 0,
                external: agg.externalRef || 0,
                direct: agg.directRef || 0,
                notification: agg.notificationRef || 0,
                board: agg.boardRef || 0,
                unknown: agg.unknownRef || 0,
              },
              topCountries,
              hourlyDistribution,
            },
          },
          upsert: true,
        },
      };
    });

    if (bulkOps.length > 0) {
      await PostAnalyticsDaily.bulkWrite(bulkOps);
    }

    console.log(`  ✅ Post analytics computed for ${date}: ${bulkOps.length} posts`);
    return { success: true, postsProcessed: bulkOps.length };
  } catch (error) {
    console.error(`  ❌ Post analytics computation failed for ${date}:`, error.message);
    return { success: false, error: error.message };
  }
}

// ── Compute Creator-Level Daily Snapshot ─────────────────────────────────────
async function computeCreatorSnapshots(dateStr = null) {
  const date = dateStr || getDateStr();

  console.log(`📊 Computing creator snapshots for ${date}...`);

  try {
    // Aggregate PostAnalyticsDaily by ownerId for this date
    const creatorAggs = await PostAnalyticsDaily.aggregate([
      { $match: { date } },
      {
        $group: {
          _id: '$ownerId',
          totalImpressions: { $sum: '$impressions' },
          totalUniqueViews: { $sum: '$uniqueViews' },
          totalLikes: { $sum: '$likes' },
          totalShares: { $sum: '$shares' },
          totalSaves: { $sum: '$saves' },
          totalComments: { $sum: '$comments' },
          totalClicks: { $sum: '$clicks' },
          postsWithData: { $sum: 1 },
          desktopTotal: { $sum: '$deviceBreakdown.desktop' },
          mobileTotal: { $sum: '$deviceBreakdown.mobile' },
          tabletTotal: { $sum: '$deviceBreakdown.tablet' },
          unknownTotal: { $sum: '$deviceBreakdown.unknown' },
          allHourly: { $push: '$hourlyDistribution' },
          // Track best performing post
          topPostData: {
            $max: {
              impressions: '$impressions',
              engagementRate: '$engagementRate',
              postId: '$postId',
            },
          },
        },
      },
    ]);

    console.log(`  → Found ${creatorAggs.length} creators with data`);

    // Get affiliate clicks per creator
    const { start, end } = getDateRange(date);
    const affiliateAggs = await AffiliateClick.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          isBot: false,
          isSuspicious: false,
        },
      },
      {
        $group: {
          _id: '$ownerId',
          totalAffiliateClicks: { $sum: 1 },
        },
      },
    ]);
    const affiliateMap = {};
    affiliateAggs.forEach((a) => {
      affiliateMap[a._id.toString()] = a.totalAffiliateClicks;
    });

    // Process each creator
    const ASSUMED_CONVERSION_RATE = 0.02; // 2% assumed conversion
    const ASSUMED_AVG_ORDER_VALUE = 25; // $25 average
    const COMMISSION_RATE = 0.05; // 5% commission

    const bulkOps = [];

    for (const agg of creatorAggs) {
      const userId = agg._id;

      // Get current follower count and post count
      const user = await User.findById(userId).select('followersCount postsCount').lean();
      if (!user) continue;

      // Get previous day follower count for growth calculation
      const prevDate = new Date(date);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = prevDate.toISOString().split('T')[0];
      const prevSnapshot = await CreatorAnalyticsSnapshot.findOne({
        userId,
        date: prevDateStr,
      }).select('followersCount').lean();

      const prevFollowers = prevSnapshot?.followersCount || user.followersCount;
      const followersGained = Math.max(0, user.followersCount - prevFollowers);
      const followersLost = Math.max(0, prevFollowers - user.followersCount);
      const netFollowerGrowth = user.followersCount - prevFollowers;

      const totalImpressions = agg.totalImpressions || 0;
      const totalEngagements = (agg.totalLikes || 0) + (agg.totalComments || 0) + (agg.totalShares || 0) + (agg.totalSaves || 0);
      const ctr = totalImpressions > 0 ? ((agg.totalClicks || 0) / totalImpressions) * 100 : 0;
      const engagementRate = totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0;

      const affiliateClicks = affiliateMap[userId.toString()] || 0;
      const estimatedRevenue = affiliateClicks * ASSUMED_CONVERSION_RATE * ASSUMED_AVG_ORDER_VALUE * COMMISSION_RATE;

      // Performance score: weighted composite
      const performanceScore = Math.min(100, Math.round(
        (Math.min(totalImpressions, 10000) / 100) * 0.3 +
        engagementRate * 5 +
        (affiliateClicks * 0.5) +
        (netFollowerGrowth > 0 ? netFollowerGrowth * 2 : 0)
      ));

      // Viral probability based on engagement rate and share ratio
      const shareRatio = totalImpressions > 0 ? (agg.totalShares || 0) / totalImpressions : 0;
      const viralProbabilityScore = Math.min(100, Math.round(
        engagementRate * 3 + shareRatio * 500 + (agg.totalShares > 10 ? 20 : 0)
      ));

      // Merge hourly distributions
      const audienceActiveHours = new Array(24).fill(0);
      (agg.allHourly || []).forEach((hourArr) => {
        if (Array.isArray(hourArr)) {
          hourArr.forEach((val, idx) => {
            if (idx < 24) audienceActiveHours[idx] += val;
          });
        }
      });

      // Get top post title
      let topPost = null;
      if (agg.topPostData?.postId) {
        const topPostDoc = await Post.findById(agg.topPostData.postId).select('title').lean();
        if (topPostDoc) {
          topPost = {
            postId: agg.topPostData.postId,
            title: topPostDoc.title,
            impressions: agg.topPostData.impressions,
            engagementRate: agg.topPostData.engagementRate,
          };
        }
      }

      bulkOps.push({
        updateOne: {
          filter: { userId, date },
          update: {
            $set: {
              totalPosts: user.postsCount,
              totalImpressions,
              totalUniqueViews: agg.totalUniqueViews || 0,
              totalLikes: agg.totalLikes || 0,
              totalShares: agg.totalShares || 0,
              totalSaves: agg.totalSaves || 0,
              totalComments: agg.totalComments || 0,
              totalClicks: agg.totalClicks || 0,
              totalAffiliateClicks: affiliateClicks,
              ctr: Math.round(ctr * 100) / 100,
              engagementRate: Math.round(engagementRate * 100) / 100,
              estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
              followersCount: user.followersCount,
              followersGained,
              followersLost,
              netFollowerGrowth,
              performanceScore,
              viralProbabilityScore,
              topPost,
              deviceBreakdown: {
                desktop: agg.desktopTotal || 0,
                mobile: agg.mobileTotal || 0,
                tablet: agg.tabletTotal || 0,
                unknown: agg.unknownTotal || 0,
              },
              audienceActiveHours,
            },
          },
          upsert: true,
        },
      });
    }

    if (bulkOps.length > 0) {
      await CreatorAnalyticsSnapshot.bulkWrite(bulkOps);
    }

    console.log(`  ✅ Creator snapshots computed for ${date}: ${bulkOps.length} creators`);
    return { success: true, creatorsProcessed: bulkOps.length };
  } catch (error) {
    console.error(`  ❌ Creator snapshots failed for ${date}:`, error.message);
    return { success: false, error: error.message };
  }
}

// ── Run Full Aggregation Pipeline ────────────────────────────────────────────
async function runDailyAggregation(dateStr = null) {
  const date = dateStr || getDateStr();
  console.log(`\n🔄 Running full analytics aggregation for ${date}...`);

  const postResult = await computePostAnalyticsDaily(date);
  const creatorResult = await computeCreatorSnapshots(date);

  console.log(`✅ Aggregation complete for ${date}\n`);
  return { postResult, creatorResult };
}

// ── Backfill Aggregations ────────────────────────────────────────────────────
async function backfillAggregations(days = 30) {
  const maxDays = Math.min(days, 90);
  console.log(`🔄 Backfilling analytics for ${maxDays} days...`);

  for (let i = 1; i <= maxDays; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    await runDailyAggregation(dateStr);
  }

  console.log(`✅ Backfill complete`);
}

module.exports = {
  computePostAnalyticsDaily,
  computeCreatorSnapshots,
  runDailyAggregation,
  backfillAggregations,
};

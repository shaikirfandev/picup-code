/**
 * Creator Analytics Query Service
 * 
 * Provides all query functions for the creator analytics dashboard.
 * Reads from pre-aggregated collections for performance.
 * Falls back to raw event queries when aggregated data is unavailable.
 */
const PostAnalyticsDaily = require('../models/PostAnalyticsDaily');
const CreatorAnalyticsSnapshot = require('../models/CreatorAnalyticsSnapshot');
const AffiliateClick = require('../models/AffiliateClick');
const PostEvent = require('../models/PostEvent');
const Post = require('../models/Post');
const User = require('../models/User');
const { Follow } = require('../models/Interaction');
const { safeRedis } = require('../config/redis');
const { getRealtimeCreatorCounters, getRealtimePostCounters, getLiveViewerCount, getDateStr } = require('./analyticsEventService');

// ── Helper: Date range ──────────────────────────────────────────────────────
function getDateRange(period, customStart, customEnd) {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'today':
      startDate = new Date(now.toISOString().split('T')[0]);
      endDate = now;
      break;
    case '7d':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      endDate = now;
      break;
    case '30d':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      endDate = now;
      break;
    case '90d':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
      endDate = now;
      break;
    case 'custom':
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      break;
    default:
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      endDate = now;
  }

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  // Previous period for comparison
  const periodMs = endDate.getTime() - startDate.getTime();
  const prevEnd = new Date(startDate.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - periodMs);
  const prevStartStr = prevStart.toISOString().split('T')[0];
  const prevEndStr = prevEnd.toISOString().split('T')[0];

  return { startStr, endStr, prevStartStr, prevEndStr, startDate, endDate };
}

// ── 1. Overview Dashboard ────────────────────────────────────────────────────
async function getCreatorOverview(userId, period = '30d', customStart, customEnd) {
  const { startStr, endStr, prevStartStr, prevEndStr } = getDateRange(period, customStart, customEnd);

  // Current period aggregation from pre-aggregated daily data
  const [currentAgg] = await PostAnalyticsDaily.aggregate([
    {
      $match: {
        ownerId: userId,
        date: { $gte: startStr, $lte: endStr },
      },
    },
    {
      $group: {
        _id: null,
        totalImpressions: { $sum: '$impressions' },
        totalUniqueViews: { $sum: '$uniqueViews' },
        totalLikes: { $sum: '$likes' },
        totalShares: { $sum: '$shares' },
        totalSaves: { $sum: '$saves' },
        totalComments: { $sum: '$comments' },
        totalClicks: { $sum: '$clicks' },
        postsWithData: { $sum: 1 },
      },
    },
  ]);

  // Also query raw PostEvent for today's events (not yet aggregated by nightly job)
  const todayStr = new Date().toISOString().split('T')[0];
  const [rawAgg] = await PostEvent.aggregate([
    {
      $match: {
        ownerId: { $in: [userId.toString(), userId] },
        isBot: { $ne: true },
        createdAt: { $gte: new Date(todayStr + 'T00:00:00.000Z'), $lte: new Date(todayStr + 'T23:59:59.999Z') },
      },
    },
    {
      $group: {
        _id: null,
        totalImpressions: { $sum: { $cond: [{ $eq: ['$eventType', 'view'] }, 1, 0] } },
        totalLikes: { $sum: { $cond: [{ $eq: ['$eventType', 'like'] }, 1, 0] } },
        totalShares: { $sum: { $cond: [{ $eq: ['$eventType', 'share'] }, 1, 0] } },
        totalSaves: { $sum: { $cond: [{ $eq: ['$eventType', 'save'] }, 1, 0] } },
        totalComments: { $sum: { $cond: [{ $eq: ['$eventType', 'comment'] }, 1, 0] } },
        totalClicks: { $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] } },
      },
    },
  ]);

  // Merge: aggregated + raw events
  const mergedCurrent = {
    totalImpressions: (currentAgg?.totalImpressions || 0) + (rawAgg?.totalImpressions || 0),
    totalUniqueViews: (currentAgg?.totalUniqueViews || 0),
    totalLikes: (currentAgg?.totalLikes || 0) + (rawAgg?.totalLikes || 0),
    totalShares: (currentAgg?.totalShares || 0) + (rawAgg?.totalShares || 0),
    totalSaves: (currentAgg?.totalSaves || 0) + (rawAgg?.totalSaves || 0),
    totalComments: (currentAgg?.totalComments || 0) + (rawAgg?.totalComments || 0),
    totalClicks: (currentAgg?.totalClicks || 0) + (rawAgg?.totalClicks || 0),
    postsWithData: currentAgg?.postsWithData || 0,
  };

  // Previous period aggregation
  const [prevAgg] = await PostAnalyticsDaily.aggregate([
    {
      $match: {
        ownerId: userId,
        date: { $gte: prevStartStr, $lte: prevEndStr },
      },
    },
    {
      $group: {
        _id: null,
        totalImpressions: { $sum: '$impressions' },
        totalUniqueViews: { $sum: '$uniqueViews' },
        totalLikes: { $sum: '$likes' },
        totalShares: { $sum: '$shares' },
        totalSaves: { $sum: '$saves' },
        totalComments: { $sum: '$comments' },
        totalClicks: { $sum: '$clicks' },
      },
    },
  ]);

  // Affiliate clicks
  const affiliateClicks = await AffiliateClick.countDocuments({
    ownerId: userId,
    createdAt: {
      $gte: new Date(startStr),
      $lte: new Date(endStr + 'T23:59:59.999Z'),
    },
    isBot: false,
    isSuspicious: false,
  });

  const prevAffiliateClicks = await AffiliateClick.countDocuments({
    ownerId: userId,
    createdAt: {
      $gte: new Date(prevStartStr),
      $lte: new Date(prevEndStr + 'T23:59:59.999Z'),
    },
    isBot: false,
    isSuspicious: false,
  });

  // Get total post count
  const totalPosts = await Post.countDocuments({
    author: userId,
    isDeleted: { $ne: true },
    status: 'published',
  });

  const cur = mergedCurrent;
  const prev = prevAgg || {};

  const impressions = cur.totalImpressions || 0;
  const clicks = cur.totalClicks || 0;
  const engagements = (cur.totalLikes || 0) + (cur.totalComments || 0) + (cur.totalShares || 0) + (cur.totalSaves || 0);
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const engagementRate = impressions > 0 ? (engagements / impressions) * 100 : 0;

  // Revenue estimation
  const CONVERSION_RATE = 0.02;
  const AVG_ORDER_VALUE = 25;
  const COMMISSION_RATE = 0.05;
  const estimatedRevenue = affiliateClicks * CONVERSION_RATE * AVG_ORDER_VALUE * COMMISSION_RATE;
  const prevEstimatedRevenue = prevAffiliateClicks * CONVERSION_RATE * AVG_ORDER_VALUE * COMMISSION_RATE;

  // Growth percentages
  const calcGrowth = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  };

  // Real-time counters
  const realtimeCounters = await getRealtimeCreatorCounters(userId.toString());

  return {
    totalPosts,
    impressions: {
      value: impressions,
      previous: prev.totalImpressions || 0,
      growth: calcGrowth(impressions, prev.totalImpressions || 0),
    },
    uniqueViews: {
      value: cur.totalUniqueViews || 0,
      previous: prev.totalUniqueViews || 0,
      growth: calcGrowth(cur.totalUniqueViews || 0, prev.totalUniqueViews || 0),
    },
    likes: {
      value: cur.totalLikes || 0,
      previous: prev.totalLikes || 0,
      growth: calcGrowth(cur.totalLikes || 0, prev.totalLikes || 0),
    },
    shares: {
      value: cur.totalShares || 0,
      previous: prev.totalShares || 0,
      growth: calcGrowth(cur.totalShares || 0, prev.totalShares || 0),
    },
    saves: {
      value: cur.totalSaves || 0,
      previous: prev.totalSaves || 0,
      growth: calcGrowth(cur.totalSaves || 0, prev.totalSaves || 0),
    },
    comments: {
      value: cur.totalComments || 0,
      previous: prev.totalComments || 0,
      growth: calcGrowth(cur.totalComments || 0, prev.totalComments || 0),
    },
    clicks: {
      value: clicks,
      previous: prev.totalClicks || 0,
      growth: calcGrowth(clicks, prev.totalClicks || 0),
    },
    affiliateClicks: {
      value: affiliateClicks,
      previous: prevAffiliateClicks,
      growth: calcGrowth(affiliateClicks, prevAffiliateClicks),
    },
    ctr: Math.round(ctr * 100) / 100,
    engagementRate: Math.round(engagementRate * 100) / 100,
    estimatedRevenue: {
      value: Math.round(estimatedRevenue * 100) / 100,
      previous: Math.round(prevEstimatedRevenue * 100) / 100,
      growth: calcGrowth(estimatedRevenue, prevEstimatedRevenue),
    },
    realtimeCounters,
  };
}

// ── 2. Engagement Over Time (for charts) ─────────────────────────────────────
async function getEngagementTimeline(userId, period = '30d', customStart, customEnd) {
  const { startStr, endStr } = getDateRange(period, customStart, customEnd);

  const dailyData = await PostAnalyticsDaily.aggregate([
    {
      $match: {
        ownerId: userId,
        date: { $gte: startStr, $lte: endStr },
      },
    },
    {
      $group: {
        _id: '$date',
        impressions: { $sum: '$impressions' },
        uniqueViews: { $sum: '$uniqueViews' },
        likes: { $sum: '$likes' },
        shares: { $sum: '$shares' },
        saves: { $sum: '$saves' },
        comments: { $sum: '$comments' },
        clicks: { $sum: '$clicks' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Also query raw PostEvent for today only (not yet aggregated by nightly job)
  const todayStr = new Date().toISOString().split('T')[0];
  const rawDailyData = await PostEvent.aggregate([
    {
      $match: {
        ownerId: { $in: [userId.toString(), userId] },
        isBot: { $ne: true },
        createdAt: { $gte: new Date(todayStr + 'T00:00:00.000Z'), $lte: new Date(todayStr + 'T23:59:59.999Z') },
      },
    },
    {
      $addFields: {
        dateStr: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      },
    },
    {
      $group: {
        _id: '$dateStr',
        impressions: { $sum: { $cond: [{ $eq: ['$eventType', 'view'] }, 1, 0] } },
        likes: { $sum: { $cond: [{ $eq: ['$eventType', 'like'] }, 1, 0] } },
        shares: { $sum: { $cond: [{ $eq: ['$eventType', 'share'] }, 1, 0] } },
        saves: { $sum: { $cond: [{ $eq: ['$eventType', 'save'] }, 1, 0] } },
        comments: { $sum: { $cond: [{ $eq: ['$eventType', 'comment'] }, 1, 0] } },
        clicks: { $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] } },
      },
    },
  ]);

  // Merge aggregated + raw by date
  const dateMap = {};
  for (const d of dailyData) {
    dateMap[d._id] = { ...d };
  }
  for (const r of rawDailyData) {
    if (dateMap[r._id]) {
      dateMap[r._id].impressions += r.impressions;
      dateMap[r._id].likes += r.likes;
      dateMap[r._id].shares += r.shares;
      dateMap[r._id].saves += r.saves;
      dateMap[r._id].comments += r.comments;
      dateMap[r._id].clicks += r.clicks;
    } else {
      dateMap[r._id] = { _id: r._id, impressions: r.impressions, uniqueViews: 0, likes: r.likes, shares: r.shares, saves: r.saves, comments: r.comments, clicks: r.clicks };
    }
  }

  const mergedDaily = Object.values(dateMap).sort((a, b) => a._id.localeCompare(b._id));

  return mergedDaily.map((d) => ({
    date: d._id,
    impressions: d.impressions,
    uniqueViews: d.uniqueViews,
    likes: d.likes,
    shares: d.shares,
    saves: d.saves,
    comments: d.comments,
    clicks: d.clicks,
    engagements: d.likes + d.shares + d.saves + d.comments,
  }));
}

// ── 3. Follower Growth Timeline ──────────────────────────────────────────────
async function getFollowerGrowth(userId, period = '30d', customStart, customEnd) {
  const { startStr, endStr } = getDateRange(period, customStart, customEnd);

  const snapshots = await CreatorAnalyticsSnapshot.find({
    userId,
    date: { $gte: startStr, $lte: endStr },
  })
    .select('date followersCount followersGained followersLost netFollowerGrowth')
    .sort({ date: 1 })
    .lean();

  return snapshots;
}

// ── 4. Post-Level Analytics ──────────────────────────────────────────────────
async function getPostAnalytics(postId, ownerId, period = '30d', customStart, customEnd) {
  const { startStr, endStr } = getDateRange(period, customStart, customEnd);

  // Verify post ownership
  const post = await Post.findOne({ _id: postId, author: ownerId }).select('title mediaType image video productUrl tags').lean();
  if (!post) return null;

  // Daily breakdown from pre-aggregated data
  const dailyData = await PostAnalyticsDaily.find({
    postId,
    date: { $gte: startStr, $lte: endStr },
  })
    .sort({ date: 1 })
    .lean();

  // Raw PostEvent for today only (not yet aggregated by nightly job)
  const todayStr = new Date().toISOString().split('T')[0];
  const rawEvents = await PostEvent.aggregate([
    {
      $match: {
        postId: postId.toString(),
        isBot: { $ne: true },
        createdAt: { $gte: new Date(todayStr + 'T00:00:00.000Z'), $lte: new Date(todayStr + 'T23:59:59.999Z') },
      },
    },
    {
      $group: {
        _id: null,
        impressions: { $sum: { $cond: [{ $eq: ['$eventType', 'view'] }, 1, 0] } },
        likes: { $sum: { $cond: [{ $eq: ['$eventType', 'like'] }, 1, 0] } },
        shares: { $sum: { $cond: [{ $eq: ['$eventType', 'share'] }, 1, 0] } },
        saves: { $sum: { $cond: [{ $eq: ['$eventType', 'save'] }, 1, 0] } },
        comments: { $sum: { $cond: [{ $eq: ['$eventType', 'comment'] }, 1, 0] } },
        clicks: { $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] } },
      },
    },
  ]);
  const rawTotals = rawEvents[0] || {};

  // Aggregate totals
  const totals = dailyData.reduce(
    (acc, d) => {
      acc.impressions += d.impressions || 0;
      acc.uniqueViews += d.uniqueViews || 0;
      acc.likes += d.likes || 0;
      acc.shares += d.shares || 0;
      acc.saves += d.saves || 0;
      acc.comments += d.comments || 0;
      acc.clicks += d.clicks || 0;
      acc.avgWatchDuration += d.avgWatchDuration || 0;
      acc.avgCompletionRate += d.avgCompletionRate || 0;
      acc.daysWithVideo += d.avgWatchDuration > 0 ? 1 : 0;

      // Merge device breakdown
      Object.keys(d.deviceBreakdown || {}).forEach((k) => {
        acc.deviceBreakdown[k] = (acc.deviceBreakdown[k] || 0) + (d.deviceBreakdown[k] || 0);
      });

      // Merge traffic sources
      Object.keys(d.trafficSources || {}).forEach((k) => {
        acc.trafficSources[k] = (acc.trafficSources[k] || 0) + (d.trafficSources[k] || 0);
      });

      // Merge hourly distribution
      (d.hourlyDistribution || []).forEach((val, idx) => {
        acc.hourlyHeatmap[idx] = (acc.hourlyHeatmap[idx] || 0) + val;
      });

      return acc;
    },
    {
      impressions: 0,
      uniqueViews: 0,
      likes: 0,
      shares: 0,
      saves: 0,
      comments: 0,
      clicks: 0,
      avgWatchDuration: 0,
      avgCompletionRate: 0,
      daysWithVideo: 0,
      deviceBreakdown: {},
      trafficSources: {},
      hourlyHeatmap: new Array(24).fill(0),
    }
  );

  // Average video metrics across days
  if (totals.daysWithVideo > 0) {
    totals.avgWatchDuration = Math.round((totals.avgWatchDuration / totals.daysWithVideo) * 100) / 100;
    totals.avgCompletionRate = Math.round((totals.avgCompletionRate / totals.daysWithVideo) * 100) / 100;
  }

  // Merge raw event counts into totals
  totals.impressions += rawTotals.impressions || 0;
  totals.likes += rawTotals.likes || 0;
  totals.shares += rawTotals.shares || 0;
  totals.saves += rawTotals.saves || 0;
  totals.comments += rawTotals.comments || 0;
  totals.clicks += rawTotals.clicks || 0;

  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const engagementRate = totals.impressions > 0
    ? ((totals.likes + totals.comments + totals.shares + totals.saves) / totals.impressions) * 100
    : 0;

  // Geo distribution
  const geoMap = {};
  dailyData.forEach((d) => {
    (d.topCountries || []).forEach(({ country, count }) => {
      geoMap[country] = (geoMap[country] || 0) + count;
    });
  });
  const geoDistribution = Object.entries(geoMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([country, count]) => ({ country, count }));

  // Live viewer count
  const liveViewers = await getLiveViewerCount(postId.toString());
  const realtimeCounters = await getRealtimePostCounters(postId.toString());

  return {
    post,
    totals: {
      ...totals,
      ctr: Math.round(ctr * 100) / 100,
      engagementRate: Math.round(engagementRate * 100) / 100,
    },
    timeline: dailyData.map((d) => ({
      date: d.date,
      impressions: d.impressions,
      uniqueViews: d.uniqueViews,
      likes: d.likes,
      shares: d.shares,
      saves: d.saves,
      comments: d.comments,
      clicks: d.clicks,
    })),
    deviceBreakdown: totals.deviceBreakdown,
    trafficSources: totals.trafficSources,
    geoDistribution,
    hourlyHeatmap: totals.hourlyHeatmap,
    liveViewers,
    realtimeCounters,
  };
}

// ── 5. All Posts Performance Table ───────────────────────────────────────────
async function getPostsPerformance(userId, {
  period = '30d',
  customStart,
  customEnd,
  sort = 'impressions',
  order = 'desc',
  page = 1,
  limit = 20,
  mediaType,
  tag,
  minImpressions,
} = {}) {
  const { startStr, endStr } = getDateRange(period, customStart, customEnd);

  // ── 1. Build filter for user's actual posts ──────────────────────────────
  const postQuery = { author: userId };
  if (mediaType) postQuery.mediaType = mediaType;
  if (tag) postQuery.tags = tag;

  // Get total count of matching posts (for pagination)
  const totalPosts = await Post.countDocuments(postQuery);

  // Get all user posts (paginated) — sorted by createdAt desc as fallback
  const allPosts = await Post.find(postQuery)
    .select('title slug mediaType image video productUrl tags createdAt')
    .sort({ createdAt: -1 })
    .lean();

  const allPostIds = allPosts.map((p) => p._id);

  // ── 2. Get analytics data for these posts in the date range ──────────────
  const analyticsMatchStage = {
    ownerId: userId,
    postId: { $in: allPostIds },
    date: { $gte: startStr, $lte: endStr },
  };

  const postAggs = await PostAnalyticsDaily.aggregate([
    { $match: analyticsMatchStage },
    {
      $group: {
        _id: '$postId',
        impressions: { $sum: '$impressions' },
        uniqueViews: { $sum: '$uniqueViews' },
        likes: { $sum: '$likes' },
        shares: { $sum: '$shares' },
        saves: { $sum: '$saves' },
        comments: { $sum: '$comments' },
        clicks: { $sum: '$clicks' },
      },
    },
  ]);

  // Also query raw PostEvent for today only (not yet aggregated by nightly job)
  const todayStr = new Date().toISOString().split('T')[0];
  const rawEventAggs = await PostEvent.aggregate([
    {
      $match: {
        postId: { $in: allPostIds.map(id => id.toString()) },
        ownerId: { $in: [userId.toString(), userId] },
        isBot: { $ne: true },
        createdAt: { $gte: new Date(todayStr + 'T00:00:00.000Z'), $lte: new Date(todayStr + 'T23:59:59.999Z') },
      },
    },
    {
      $group: {
        _id: '$postId',
        impressions: { $sum: { $cond: [{ $eq: ['$eventType', 'view'] }, 1, 0] } },
        uniqueViewers: { $addToSet: { $cond: [{ $eq: ['$eventType', 'view'] }, { $ifNull: ['$viewerId', '$sessionId'] }, '$$REMOVE'] } },
        likes: { $sum: { $cond: [{ $eq: ['$eventType', 'like'] }, 1, 0] } },
        shares: { $sum: { $cond: [{ $eq: ['$eventType', 'share'] }, 1, 0] } },
        saves: { $sum: { $cond: [{ $eq: ['$eventType', 'save'] }, 1, 0] } },
        comments: { $sum: { $cond: [{ $eq: ['$eventType', 'comment'] }, 1, 0] } },
        clicks: { $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] } },
      },
    },
  ]);

  // Build map of analytics by postId — merge pre-aggregated + raw events
  const analyticsMap = {};
  postAggs.forEach((agg) => {
    analyticsMap[agg._id.toString()] = agg;
  });

  // Merge raw events (add to existing or create new entries)
  rawEventAggs.forEach((raw) => {
    const key = raw._id.toString();
    if (analyticsMap[key]) {
      // Add raw data on top of aggregated data
      analyticsMap[key].impressions += raw.impressions || 0;
      analyticsMap[key].uniqueViews = (analyticsMap[key].uniqueViews || 0) + (raw.uniqueViewers?.length || 0);
      analyticsMap[key].likes += raw.likes || 0;
      analyticsMap[key].shares += raw.shares || 0;
      analyticsMap[key].saves += raw.saves || 0;
      analyticsMap[key].comments += raw.comments || 0;
      analyticsMap[key].clicks += raw.clicks || 0;
    } else {
      analyticsMap[key] = {
        _id: raw._id,
        impressions: raw.impressions || 0,
        uniqueViews: raw.uniqueViewers?.length || 0,
        likes: raw.likes || 0,
        shares: raw.shares || 0,
        saves: raw.saves || 0,
        comments: raw.comments || 0,
        clicks: raw.clicks || 0,
      };
    }
  });

  // ── 3. Merge: every post gets a row, with analytics or zeros ─────────────
  let results = allPosts.map((post) => {
    const agg = analyticsMap[post._id.toString()];
    const impressions = agg?.impressions || 0;
    const uniqueViews = agg?.uniqueViews || 0;
    const likes = agg?.likes || 0;
    const shares = agg?.shares || 0;
    const saves = agg?.saves || 0;
    const comments = agg?.comments || 0;
    const clicks = agg?.clicks || 0;

    const engagementRate = impressions > 0
      ? Math.round(((likes + comments + shares + saves) / impressions) * 10000) / 100
      : 0;
    const ctr = impressions > 0
      ? Math.round((clicks / impressions) * 10000) / 100
      : 0;

    return {
      postId: post._id,
      post,
      impressions,
      uniqueViews,
      likes,
      shares,
      saves,
      comments,
      clicks,
      ctr,
      engagementRate,
    };
  });

  // ── 4. Filter by minImpressions if set ───────────────────────────────────
  if (minImpressions) {
    results = results.filter((r) => r.impressions >= parseInt(minImpressions));
  }

  // ── 5. Sort ──────────────────────────────────────────────────────────────
  const sortDir = order === 'asc' ? 1 : -1;
  results.sort((a, b) => {
    const aVal = a[sort] ?? 0;
    const bVal = b[sort] ?? 0;
    return (aVal - bVal) * sortDir;
  });

  // ── 6. Paginate ──────────────────────────────────────────────────────────
  const total = results.length;
  const startIdx = (page - 1) * limit;
  const paginatedResults = results.slice(startIdx, startIdx + limit);
  const hasMore = startIdx + limit < total;

  return {
    posts: paginatedResults,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore,
    },
  };
}

// ── 6. Affiliate Analytics ───────────────────────────────────────────────────
async function getAffiliateAnalytics(userId, period = '30d', customStart, customEnd) {
  const { startStr, endStr, startDate } = getDateRange(period, customStart, customEnd);
  const endDate = new Date(endStr + 'T23:59:59.999Z');

  const matchStage = {
    ownerId: userId,
    createdAt: { $gte: startDate, $lte: endDate },
    isBot: false,
  };

  // Total and unique clicks
  const [clickStats] = await AffiliateClick.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalClicks: { $sum: 1 },
        uniqueSessions: { $addToSet: '$sessionId' },
        suspiciousClicks: {
          $sum: { $cond: ['$isSuspicious', 1, 0] },
        },
      },
    },
  ]);

  // Geo distribution
  const geoDistribution = await AffiliateClick.aggregate([
    { $match: { ...matchStage, isSuspicious: false } },
    { $group: { _id: '$country', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);

  // Device breakdown
  const deviceBreakdown = await AffiliateClick.aggregate([
    { $match: { ...matchStage, isSuspicious: false } },
    { $group: { _id: '$deviceType', count: { $sum: 1 } } },
  ]);

  // Time of day distribution
  const timeDistribution = await AffiliateClick.aggregate([
    { $match: { ...matchStage, isSuspicious: false } },
    { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Daily click timeline
  const dailyClicks = await AffiliateClick.aggregate([
    { $match: { ...matchStage, isSuspicious: false } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        clicks: { $sum: 1 },
        uniqueSessions: { $addToSet: '$sessionId' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Per-URL performance
  const urlPerformance = await AffiliateClick.aggregate([
    { $match: { ...matchStage, isSuspicious: false } },
    {
      $group: {
        _id: '$productUrl',
        clicks: { $sum: 1 },
        uniqueSessions: { $addToSet: '$sessionId' },
        posts: { $addToSet: '$postId' },
      },
    },
    { $sort: { clicks: -1 } },
    { $limit: 20 },
  ]);

  const totalClicks = clickStats?.totalClicks || 0;
  const uniqueClicks = clickStats?.uniqueSessions?.length || 0;
  const CONVERSION_RATE = 0.02;
  const AVG_ORDER = 25;
  const COMMISSION = 0.05;

  return {
    totalClicks,
    uniqueClicks,
    suspiciousClicks: clickStats?.suspiciousClicks || 0,
    conversionEstimate: Math.round(totalClicks * CONVERSION_RATE),
    revenueEstimate: Math.round(totalClicks * CONVERSION_RATE * AVG_ORDER * COMMISSION * 100) / 100,
    geoDistribution: geoDistribution.map((g) => ({ country: g._id || 'Unknown', count: g.count })),
    deviceBreakdown: deviceBreakdown.reduce((acc, d) => {
      acc[d._id || 'unknown'] = d.count;
      return acc;
    }, {}),
    timeDistribution: (() => {
      const arr = new Array(24).fill(0);
      timeDistribution.forEach((t) => { arr[t._id] = t.count; });
      return arr;
    })(),
    dailyClicks: dailyClicks.map((d) => ({
      date: d._id,
      clicks: d.clicks,
      uniqueClicks: d.uniqueSessions?.length || 0,
    })),
    urlPerformance: urlPerformance.map((u) => ({
      url: u._id,
      clicks: u.clicks,
      uniqueClicks: u.uniqueSessions?.length || 0,
      postsCount: u.posts?.length || 0,
    })),
  };
}

// ── 7. Audience Insights ─────────────────────────────────────────────────────
async function getAudienceInsights(userId, period = '30d', customStart, customEnd) {
  const { startStr, endStr, startDate } = getDateRange(period, customStart, customEnd);
  const endDate = new Date(endStr + 'T23:59:59.999Z');

  const matchStage = {
    ownerId: userId,
    createdAt: { $gte: startDate, $lte: endDate },
    isBot: false,
    eventType: 'view',
  };

  // Location distribution
  const locationData = await PostEvent.aggregate([
    { $match: matchStage },
    { $group: { _id: '$country', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 30 },
  ]);

  // Device usage
  const deviceData = await PostEvent.aggregate([
    { $match: { ...matchStage, eventType: { $exists: true } } },
    { $group: { _id: '$deviceType', count: { $sum: 1 } } },
  ]);

  // Browser distribution
  const browserData = await PostEvent.aggregate([
    { $match: matchStage },
    { $group: { _id: '$browser', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  // OS distribution
  const osData = await PostEvent.aggregate([
    { $match: matchStage },
    { $group: { _id: '$os', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  // Active time heatmap (day of week × hour)
  const timeHeatmap = await PostEvent.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          dayOfWeek: { $dayOfWeek: '$createdAt' },
          hour: { $hour: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // Format heatmap as 7×24 matrix
  const heatmapMatrix = Array.from({ length: 7 }, () => new Array(24).fill(0));
  timeHeatmap.forEach((t) => {
    const day = (t._id.dayOfWeek - 1) % 7; // 0=Sun to 6=Sat
    const hour = t._id.hour;
    heatmapMatrix[day][hour] = t.count;
  });

  // Returning vs. new viewers
  const viewerStats = await PostEvent.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $ifNull: ['$viewerId', '$sessionId'] },
        viewCount: { $sum: 1 },
        firstView: { $min: '$createdAt' },
      },
    },
    {
      $group: {
        _id: null,
        totalViewers: { $sum: 1 },
        returningViewers: {
          $sum: { $cond: [{ $gt: ['$viewCount', 1] }, 1, 0] },
        },
        newViewers: {
          $sum: { $cond: [{ $eq: ['$viewCount', 1] }, 1, 0] },
        },
      },
    },
  ]);

  // Follower demographics (based on followers who viewed)
  const followerViewers = await PostEvent.aggregate([
    { $match: { ...matchStage, viewerId: { $ne: null } } },
    {
      $lookup: {
        from: 'follows',
        let: { viewerId: '$viewerId', ownerId: '$ownerId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$follower', '$$viewerId'] },
                  { $eq: ['$following', '$$ownerId'] },
                ],
              },
            },
          },
        ],
        as: 'followRelation',
      },
    },
    {
      $group: {
        _id: null,
        totalViewersFromFollowers: {
          $sum: { $cond: [{ $gt: [{ $size: '$followRelation' }, 0] }, 1, 0] },
        },
        totalViewersNotFollowers: {
          $sum: { $cond: [{ $eq: [{ $size: '$followRelation' }, 0] }, 1, 0] },
        },
      },
    },
  ]);

  return {
    locationDistribution: locationData.map((l) => ({
      country: l._id || 'Unknown',
      count: l.count,
    })),
    deviceUsage: deviceData.reduce((acc, d) => {
      acc[d._id || 'unknown'] = d.count;
      return acc;
    }, {}),
    browserDistribution: browserData.map((b) => ({
      browser: b._id || 'Unknown',
      count: b.count,
    })),
    osDistribution: osData.map((o) => ({
      os: o._id || 'Unknown',
      count: o.count,
    })),
    activeTimeHeatmap: heatmapMatrix,
    viewerBreakdown: {
      total: viewerStats[0]?.totalViewers || 0,
      returning: viewerStats[0]?.returningViewers || 0,
      new: viewerStats[0]?.newViewers || 0,
    },
    followerEngagement: {
      fromFollowers: followerViewers[0]?.totalViewersFromFollowers || 0,
      fromNonFollowers: followerViewers[0]?.totalViewersNotFollowers || 0,
    },
  };
}

// ── 8. AI Insights ───────────────────────────────────────────────────────────
async function getAIInsights(userId) {
  // Best posting times based on historical engagement
  const bestTimes = await PostAnalyticsDaily.aggregate([
    { $match: { ownerId: userId } },
    { $unwind: { path: '$hourlyDistribution', includeArrayIndex: 'hour' } },
    {
      $group: {
        _id: '$hour',
        totalEngagement: { $sum: '$hourlyDistribution' },
      },
    },
    { $sort: { totalEngagement: -1 } },
    { $limit: 5 },
  ]);

  // Get top performing post types
  const postTypePerformance = await PostAnalyticsDaily.aggregate([
    { $match: { ownerId: userId } },
    {
      $lookup: {
        from: 'posts',
        localField: 'postId',
        foreignField: '_id',
        as: 'post',
      },
    },
    { $unwind: '$post' },
    {
      $group: {
        _id: '$post.mediaType',
        avgImpressions: { $avg: '$impressions' },
        avgEngagementRate: { $avg: '$engagementRate' },
        totalPosts: { $sum: 1 },
      },
    },
  ]);

  // Get top performing tags
  const topTags = await PostAnalyticsDaily.aggregate([
    { $match: { ownerId: userId } },
    {
      $lookup: {
        from: 'posts',
        localField: 'postId',
        foreignField: '_id',
        as: 'post',
      },
    },
    { $unwind: '$post' },
    { $unwind: '$post.tags' },
    {
      $group: {
        _id: '$post.tags',
        avgImpressions: { $avg: '$impressions' },
        avgEngagementRate: { $avg: '$engagementRate' },
        totalPosts: { $sum: 1 },
      },
    },
    { $sort: { avgEngagementRate: -1 } },
    { $limit: 10 },
  ]);

  // Performance trend (last 30 days avg vs. previous 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const [recentPerf] = await CreatorAnalyticsSnapshot.aggregate([
    {
      $match: {
        userId,
        date: { $gte: thirtyDaysAgo.toISOString().split('T')[0] },
      },
    },
    {
      $group: {
        _id: null,
        avgEngagement: { $avg: '$engagementRate' },
        avgImpressions: { $avg: '$totalImpressions' },
        avgPerformance: { $avg: '$performanceScore' },
      },
    },
  ]);

  const [prevPerf] = await CreatorAnalyticsSnapshot.aggregate([
    {
      $match: {
        userId,
        date: {
          $gte: sixtyDaysAgo.toISOString().split('T')[0],
          $lt: thirtyDaysAgo.toISOString().split('T')[0],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgEngagement: { $avg: '$engagementRate' },
        avgImpressions: { $avg: '$totalImpressions' },
        avgPerformance: { $avg: '$performanceScore' },
      },
    },
  ]);

  return {
    bestPostingTimes: bestTimes.map((t) => ({
      hour: t._id,
      label: `${t._id}:00 - ${t._id + 1}:00`,
      engagementScore: t.totalEngagement,
    })),
    postTypePerformance: postTypePerformance.map((p) => ({
      type: p._id,
      avgImpressions: Math.round(p.avgImpressions),
      avgEngagementRate: Math.round(p.avgEngagementRate * 100) / 100,
      totalPosts: p.totalPosts,
    })),
    topTags: topTags.map((t) => ({
      tag: t._id,
      avgImpressions: Math.round(t.avgImpressions),
      avgEngagementRate: Math.round(t.avgEngagementRate * 100) / 100,
      postCount: t.totalPosts,
    })),
    performanceTrend: {
      current: {
        avgEngagement: Math.round((recentPerf?.avgEngagement || 0) * 100) / 100,
        avgImpressions: Math.round(recentPerf?.avgImpressions || 0),
        avgPerformanceScore: Math.round(recentPerf?.avgPerformance || 0),
      },
      previous: {
        avgEngagement: Math.round((prevPerf?.avgEngagement || 0) * 100) / 100,
        avgImpressions: Math.round(prevPerf?.avgImpressions || 0),
        avgPerformanceScore: Math.round(prevPerf?.avgPerformance || 0),
      },
    },
  };
}

// ── 9. Export Data ───────────────────────────────────────────────────────────
async function exportAnalyticsCSV(userId, period = '30d', customStart, customEnd) {
  const { startStr, endStr } = getDateRange(period, customStart, customEnd);

  const dailyData = await PostAnalyticsDaily.aggregate([
    {
      $match: {
        ownerId: userId,
        date: { $gte: startStr, $lte: endStr },
      },
    },
    {
      $lookup: {
        from: 'posts',
        localField: 'postId',
        foreignField: '_id',
        as: 'post',
      },
    },
    { $unwind: { path: '$post', preserveNullAndEmptyArrays: true } },
    { $sort: { date: -1, impressions: -1 } },
  ]);

  // Build CSV
  const headers = [
    'Date', 'Post Title', 'Post Type', 'Impressions', 'Unique Views',
    'Likes', 'Shares', 'Saves', 'Comments', 'Clicks', 'CTR', 'Engagement Rate',
    'Desktop', 'Mobile', 'Tablet',
  ];

  const rows = dailyData.map((d) => [
    d.date,
    `"${(d.post?.title || 'N/A').replace(/"/g, '""')}"`,
    d.post?.mediaType || 'N/A',
    d.impressions,
    d.uniqueViews,
    d.likes,
    d.shares,
    d.saves,
    d.comments,
    d.clicks,
    d.ctr,
    d.engagementRate,
    d.deviceBreakdown?.desktop || 0,
    d.deviceBreakdown?.mobile || 0,
    d.deviceBreakdown?.tablet || 0,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

module.exports = {
  getCreatorOverview,
  getEngagementTimeline,
  getFollowerGrowth,
  getPostAnalytics,
  getPostsPerformance,
  getAffiliateAnalytics,
  getAudienceInsights,
  getAIInsights,
  exportAnalyticsCSV,
};

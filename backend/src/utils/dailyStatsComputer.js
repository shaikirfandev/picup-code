/**
 * Daily stats computation.
 * Can be called by a cron job or on-demand from admin API.
 * Computes stats for a given date (defaults to yesterday).
 */
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const BlogPost = require('../models/BlogPost');
const { Like, Save } = require('../models/Interaction');
const Comment = require('../models/Comment');
const Report = require('../models/Report');
const AIGeneration = require('../models/AIGeneration');
const LoginLog = require('../models/LoginLog');
const DailyStats = require('../models/DailyStats');

/**
 * Compute and upsert daily stats for a specific date.
 * @param {string} dateStr - YYYY-MM-DD format. Defaults to yesterday.
 */
async function computeDailyStats(dateStr) {
  if (!dateStr) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    dateStr = yesterday.toISOString().slice(0, 10);
  }

  const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);
  const dateFilter = { $gte: dayStart, $lte: dayEnd };

  try {
    const [
      newUsers,
      logins,
      uniqueLoginsResult,
      posts,
      blogPosts,
      likes,
      saves,
      comments,
      reports,
      aiGenerations,
      viewsResult,
      loginsByMethodResult,
      loginsByDeviceResult,
      topCountriesResult,
    ] = await Promise.all([
      User.countDocuments({ createdAt: dateFilter }),
      LoginLog.countDocuments({ createdAt: dateFilter, success: true }),
      LoginLog.distinct('user', { createdAt: dateFilter, success: true }),
      Post.countDocuments({ createdAt: dateFilter }),
      BlogPost.countDocuments({ createdAt: dateFilter }),
      Like.countDocuments({ createdAt: dateFilter }),
      Save.countDocuments({ createdAt: dateFilter }),
      Comment.countDocuments({ createdAt: dateFilter }),
      Report.countDocuments({ createdAt: dateFilter }),
      AIGeneration.countDocuments({ createdAt: dateFilter }),
      // Sum of views from posts created that day (rough approximation)
      Post.aggregate([
        { $match: { createdAt: dateFilter } },
        { $group: { _id: null, total: { $sum: '$viewsCount' } } },
      ]),
      // Login method breakdown
      LoginLog.aggregate([
        { $match: { createdAt: dateFilter, success: true } },
        { $group: { _id: '$method', count: { $sum: 1 } } },
      ]),
      // Login device breakdown
      LoginLog.aggregate([
        { $match: { createdAt: dateFilter, success: true } },
        { $group: { _id: '$deviceType', count: { $sum: 1 } } },
      ]),
      // Top countries
      LoginLog.aggregate([
        { $match: { createdAt: dateFilter, success: true, country: { $ne: null } } },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    // Build method/device maps
    const loginsByMethod = { email: 0, google: 0, github: 0 };
    loginsByMethodResult.forEach((r) => {
      if (loginsByMethod.hasOwnProperty(r._id)) loginsByMethod[r._id] = r.count;
    });

    const loginsByDevice = { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };
    loginsByDeviceResult.forEach((r) => {
      if (loginsByDevice.hasOwnProperty(r._id)) loginsByDevice[r._id] = r.count;
    });

    const topCountries = topCountriesResult.map((r) => ({
      country: r._id,
      count: r.count,
    }));

    await DailyStats.findOneAndUpdate(
      { date: dateStr },
      {
        $set: {
          newUsers,
          logins,
          uniqueLogins: uniqueLoginsResult.length,
          posts,
          blogPosts,
          views: viewsResult[0]?.total || 0,
          likes,
          saves,
          comments,
          reports,
          aiGenerations,
          loginsByMethod,
          loginsByDevice,
          topCountries,
        },
      },
      { upsert: true, new: true }
    );

    console.log(`[DailyStats] Computed stats for ${dateStr}`);
    return true;
  } catch (err) {
    console.error(`[DailyStats] Error computing stats for ${dateStr}:`, err.message);
    return false;
  }
}

/**
 * Compute stats for multiple past days (backfill).
 * @param {number} days - Number of past days to compute.
 */
async function backfillDailyStats(days = 30) {
  const results = [];
  for (let i = 1; i <= days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const ok = await computeDailyStats(dateStr);
    results.push({ date: dateStr, success: ok });
  }
  return results;
}

/**
 * Reset isActiveToday for all users (run at midnight).
 */
async function resetDailyActiveFlags() {
  try {
    await User.updateMany({ isActiveToday: true }, { $set: { isActiveToday: false } });
    console.log('[DailyStats] Reset isActiveToday flags');
  } catch (err) {
    console.error('[DailyStats] Error resetting active flags:', err.message);
  }
}

module.exports = {
  computeDailyStats,
  backfillDailyStats,
  resetDailyActiveFlags,
};

/**
 * Ad Campaign Worker
 * Runs periodic tasks:
 * - Auto-complete expired campaigns
 * - Auto-pause over-budget campaigns
 * - Aggregate daily ad stats
 */
const Advertisement = require('../models/Advertisement');
const AdClickEvent = require('../models/AdClickEvent');

const WORKER_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Complete ads whose campaign end date has passed
 */
async function completeExpiredCampaigns() {
  const now = new Date();
  const result = await Advertisement.updateMany(
    {
      status: { $in: ['active', 'paused'] },
      'campaign.endDate': { $lte: now, $ne: null },
    },
    { $set: { status: 'completed' } }
  );
  if (result.modifiedCount > 0) {
    console.log(`[AdWorker] Completed ${result.modifiedCount} expired campaigns`);
  }
  return result.modifiedCount;
}

/**
 * Pause ads that have exhausted their budget
 */
async function pauseOverBudgetAds() {
  const result = await Advertisement.updateMany(
    {
      status: 'active',
      'campaign.budget': { $gt: 0 },
      $expr: { $gte: ['$campaign.spent', '$campaign.budget'] },
    },
    { $set: { status: 'completed' } }
  );
  if (result.modifiedCount > 0) {
    console.log(`[AdWorker] Completed ${result.modifiedCount} over-budget ads`);
  }
  return result.modifiedCount;
}

/**
 * Aggregate daily stats for each active ad (last 24h snapshot)
 */
async function aggregateDailyStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const activeAds = await Advertisement.find({ status: { $in: ['active', 'paused'] } }).select('_id').lean();

  for (const ad of activeAds) {
    const stats = await AdClickEvent.aggregate([
      {
        $match: {
          advertisement: ad._id,
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
        },
      },
    ]);

    const dayStats = { date: today, impressions: 0, clicks: 0, views: 0, spent: 0 };
    stats.forEach((s) => {
      if (s._id === 'impression') dayStats.impressions = s.count;
      if (s._id === 'click') dayStats.clicks = s.count;
      if (s._id === 'view') dayStats.views = s.count;
    });

    // Upsert today's stats
    await Advertisement.findByIdAndUpdate(ad._id, {
      $pull: { dailyStats: { date: today } },
    });
    await Advertisement.findByIdAndUpdate(ad._id, {
      $push: {
        dailyStats: {
          $each: [dayStats],
          $slice: -30, // keep last 30 days
        },
      },
    });
  }

  console.log(`[AdWorker] Aggregated daily stats for ${activeAds.length} ads`);
  return activeAds.length;
}

/**
 * Start the worker loop
 */
function startAdCampaignWorker() {
  console.log('[AdWorker] Starting ad campaign worker...');

  const run = async () => {
    try {
      await completeExpiredCampaigns();
      await pauseOverBudgetAds();
      await aggregateDailyStats();
    } catch (err) {
      console.error('[AdWorker] Error:', err.message);
    }
  };

  // Initial run after 30s
  setTimeout(run, 30000);
  // Then every 5 minutes
  setInterval(run, WORKER_INTERVAL);
}

module.exports = {
  startAdCampaignWorker,
  completeExpiredCampaigns,
  pauseOverBudgetAds,
  aggregateDailyStats,
};

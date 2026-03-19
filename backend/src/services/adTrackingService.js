/**
 * Ad Tracking Service
 * Handles impression/click tracking with deduplication via Redis,
 * fraud detection, and budget enforcement.
 */
const AdClickEvent = require('../models/AdClickEvent');
const Advertisement = require('../models/Advertisement');
const Wallet = require('../models/Wallet');
const { getRedisClient, isRedisConnected, safeRedisOp } = require('../config/redis');

const IMPRESSION_DEDUP_TTL = 3600;   // 1 hour per user per ad
const CLICK_DEDUP_TTL = 300;          // 5 min per user per ad
const CLICK_RATE_LIMIT = 10;          // max 10 clicks per ad per user per hour
const CPC_RATE = 0.02;                // $0.02 per click
const CPM_RATE = 0.50;                // $0.50 per 1000 impressions

/**
 * Track an impression with dedup
 */
async function trackImpression(adId, { userId, sessionId, ip, userAgent, placement }) {
  const dedupKey = `ad:imp:${adId}:${userId || sessionId || ip}`;

  // Deduplicate via Redis
  if (isRedisConnected()) {
    const exists = await safeRedisOp('get', dedupKey);
    if (exists) return { deduplicated: true };
    await safeRedisOp('set', dedupKey, '1', 'EX', IMPRESSION_DEDUP_TTL);
  }

  // Record event
  const event = await AdClickEvent.create({
    advertisement: adId,
    eventType: 'impression',
    user: userId || undefined,
    sessionId: sessionId || '',
    ip: ip || '',
    userAgent: userAgent || '',
    placement: placement || '',
  });

  // Increment ad counter
  await Advertisement.findByIdAndUpdate(adId, { $inc: { impressions: 1 } });

  // CPM billing — charge every 1000 impressions
  const ad = await Advertisement.findById(adId).lean();
  if (ad && ad.impressions > 0 && ad.impressions % 1000 === 0) {
    await chargeAdBudget(ad, CPM_RATE, `CPM charge (${ad.impressions} impressions)`);
  }

  return { tracked: true, eventId: event._id };
}

/**
 * Track a click with dedup and fraud detection
 */
async function trackClick(adId, { userId, sessionId, ip, userAgent, referrer }) {
  const dedupKey = `ad:click:${adId}:${userId || sessionId || ip}`;
  const rateLimitKey = `ad:clk_rate:${adId}:${userId || ip}`;

  // Rate limit check
  if (isRedisConnected()) {
    const clickCount = await safeRedisOp('get', rateLimitKey);
    if (clickCount && parseInt(clickCount) >= CLICK_RATE_LIMIT) {
      // Log suspicious
      await AdClickEvent.create({
        advertisement: adId,
        eventType: 'click',
        user: userId || undefined,
        sessionId: sessionId || '',
        ip: ip || '',
        userAgent: userAgent || '',
        isSuspicious: true,
        suspiciousReason: 'Rate limit exceeded',
      });
      return { blocked: true, reason: 'rate_limit' };
    }

    // Dedup
    const exists = await safeRedisOp('get', dedupKey);
    if (exists) return { deduplicated: true };

    await safeRedisOp('set', dedupKey, '1', 'EX', CLICK_DEDUP_TTL);
    await safeRedisOp('incr', rateLimitKey);
    await safeRedisOp('expire', rateLimitKey, 3600);
  }

  // Record event
  const event = await AdClickEvent.create({
    advertisement: adId,
    eventType: 'click',
    user: userId || undefined,
    sessionId: sessionId || '',
    ip: ip || '',
    userAgent: userAgent || '',
    referrer: referrer || '',
  });

  // Increment ad counter
  await Advertisement.findByIdAndUpdate(adId, { $inc: { clicks: 1 } });

  // CPC billing
  const ad = await Advertisement.findById(adId).lean();
  if (ad) {
    await chargeAdBudget(ad, CPC_RATE, `CPC charge (click #${ad.clicks + 1})`);
  }

  return { tracked: true, eventId: event._id };
}

/**
 * Track a view event
 */
async function trackView(adId, { userId, sessionId }) {
  await AdClickEvent.create({
    advertisement: adId,
    eventType: 'view',
    user: userId || undefined,
    sessionId: sessionId || '',
  });
  await Advertisement.findByIdAndUpdate(adId, { $inc: { views: 1 } });
  return { tracked: true };
}

/**
 * Charge ad budget from advertiser's wallet
 */
async function chargeAdBudget(ad, amount, description) {
  try {
    // Check budget limit
    if (ad.campaign.spent + amount > ad.campaign.budget) {
      // Budget exhausted — pause the ad
      await Advertisement.findByIdAndUpdate(ad._id, {
        status: 'completed',
        'campaign.spent': ad.campaign.budget,
      });
      return { exhausted: true };
    }

    // Debit from wallet
    const wallet = await Wallet.findOne({ user: ad.advertiser });
    if (wallet && wallet.balance >= amount) {
      await wallet.debit(amount, description, ad._id.toString());
      await Advertisement.findByIdAndUpdate(ad._id, {
        $inc: { 'campaign.spent': amount },
      });
      return { charged: true, amount };
    }
    // Insufficient wallet balance — pause ad
    await Advertisement.findByIdAndUpdate(ad._id, { status: 'paused' });
    return { paused: true, reason: 'insufficient_balance' };
  } catch (err) {
    console.error('Budget charge error:', err.message);
    return { error: err.message };
  }
}

/**
 * Get analytics aggregation for an ad
 */
async function getAdEventAnalytics(adId, { startDate, endDate } = {}) {
  const match = { advertisement: adId };
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const [eventCounts, dailyBreakdown, deviceBreakdown, geoBreakdown] = await Promise.all([
    // Total counts by type
    AdClickEvent.aggregate([
      { $match: match },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
    ]),
    // Daily breakdown
    AdClickEvent.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$eventType',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]),
    // Device breakdown
    AdClickEvent.aggregate([
      { $match: { ...match, eventType: 'click' } },
      { $group: { _id: '$deviceType', count: { $sum: 1 } } },
    ]),
    // Geo breakdown
    AdClickEvent.aggregate([
      { $match: { ...match, eventType: 'click', country: { $ne: '' } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
  ]);

  // Transform daily breakdown into chart-friendly format
  const dailyMap = {};
  dailyBreakdown.forEach((item) => {
    if (!dailyMap[item._id.date]) {
      dailyMap[item._id.date] = { date: item._id.date, impressions: 0, clicks: 0, views: 0, conversions: 0 };
    }
    dailyMap[item._id.date][item._id.type + 's'] = item.count;
  });

  return {
    totals: eventCounts.reduce((acc, e) => ({ ...acc, [e._id + 's']: e.count }), {}),
    daily: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)),
    devices: deviceBreakdown.map((d) => ({ device: d._id, count: d.count })),
    geo: geoBreakdown.map((g) => ({ country: g._id, count: g.count })),
  };
}

module.exports = {
  trackImpression,
  trackClick,
  trackView,
  chargeAdBudget,
  getAdEventAnalytics,
};

const Advertisement = require('../models/Advertisement');
const AdClickEvent = require('../models/AdClickEvent');
const Payment = require('../models/Payment');
const Wallet = require('../models/Wallet');
const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');
const { uploadImageToGridFS } = require('../config/gridfs');
const adTrackingService = require('../services/adTrackingService');

// ──────────────────────────────────────────────
// DASHBOARD
// ──────────────────────────────────────────────

/**
 * GET /ads/dashboard — Advertiser dashboard overview
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { period = '30d' } = req.query;

    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalAds,
      activeAds,
      statusCounts,
      totalClicks,
      totalImpressions,
      totalViews,
      totalSpent,
      recentAds,
      clickTrends,
      categoryPerformance,
    ] = await Promise.all([
      Advertisement.countDocuments({ advertiser: userId }),
      Advertisement.countDocuments({ advertiser: userId, status: 'active' }),
      Advertisement.aggregate([
        { $match: { advertiser: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Advertisement.aggregate([
        { $match: { advertiser: userId } },
        { $group: { _id: null, total: { $sum: '$clicks' } } },
      ]),
      Advertisement.aggregate([
        { $match: { advertiser: userId } },
        { $group: { _id: null, total: { $sum: '$impressions' } } },
      ]),
      Advertisement.aggregate([
        { $match: { advertiser: userId } },
        { $group: { _id: null, total: { $sum: '$views' } } },
      ]),
      Advertisement.aggregate([
        { $match: { advertiser: userId } },
        { $group: { _id: null, total: { $sum: '$campaign.spent' } } },
      ]),
      Advertisement.find({ advertiser: userId, status: 'active' })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      AdClickEvent.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            eventType: { $in: ['click', 'impression'] },
          },
        },
        {
          $lookup: {
            from: 'advertisements',
            localField: 'advertisement',
            foreignField: '_id',
            as: 'ad',
          },
        },
        { $unwind: '$ad' },
        { $match: { 'ad.advertiser': userId } },
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
      Advertisement.aggregate([
        { $match: { advertiser: userId, targetCategories: { $exists: true, $ne: [] } } },
        { $unwind: '$targetCategories' },
        {
          $group: {
            _id: '$targetCategories',
            impressions: { $sum: '$impressions' },
            clicks: { $sum: '$clicks' },
            spent: { $sum: '$campaign.spent' },
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        { $sort: { clicks: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const trendsMap = {};
    clickTrends.forEach((item) => {
      if (!trendsMap[item._id.date]) {
        trendsMap[item._id.date] = { date: item._id.date, clicks: 0, impressions: 0 };
      }
      if (item._id.type === 'click') trendsMap[item._id.date].clicks = item.count;
      if (item._id.type === 'impression') trendsMap[item._id.date].impressions = item.count;
    });

    const totalClk = totalClicks[0]?.total || 0;
    const totalImp = totalImpressions[0]?.total || 0;
    const engagementScore = totalImp > 0 ? parseFloat(((totalClk / totalImp) * 100).toFixed(2)) : 0;

    const statusMap = {};
    statusCounts.forEach((s) => { statusMap[s._id] = s.count; });

    ApiResponse.success(res, {
      stats: {
        totalAds,
        activeAds,
        pendingAds: statusMap.pending || 0,
        completedAds: statusMap.completed || 0,
        totalClicks: totalClk,
        totalImpressions: totalImp,
        totalViews: totalViews[0]?.total || 0,
        totalSpent: parseFloat((totalSpent[0]?.total || 0).toFixed(2)),
        engagementScore,
        ctr: totalImp > 0 ? parseFloat(((totalClk / totalImp) * 100).toFixed(2)) : 0,
      },
      statusBreakdown: statusMap,
      clickTrends: Object.values(trendsMap).sort((a, b) => a.date.localeCompare(b.date)),
      categoryPerformance: categoryPerformance.map((c) => ({
        name: c.category?.name || 'Unknown',
        impressions: c.impressions,
        clicks: c.clicks,
        spent: parseFloat(c.spent.toFixed(2)),
        count: c.count,
      })),
      recentActiveAds: recentAds,
      period,
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// CRUD
// ──────────────────────────────────────────────

exports.createAd = async (req, res, next) => {
  try {
    const {
      title, description, redirectUrl, placement, campaign,
      targetCategories, targetTags, targetLocations, targetAudience,
      promotionType,
    } = req.body;

    let image;
    if (req.file) {
      const result = await uploadImageToGridFS(req.file.buffer, req.file.originalname, req.file.mimetype);
      image = { url: result.url, fileId: result.fileId, width: result.width, height: result.height };
    }

    const parsedCampaign = campaign ? (typeof campaign === 'string' ? JSON.parse(campaign) : campaign) : undefined;

    const ad = await Advertisement.create({
      title,
      description,
      redirectUrl,
      image: image || undefined,
      advertiser: req.user._id,
      placement: placement || 'feed',
      campaign: parsedCampaign,
      targetCategories: targetCategories ? (Array.isArray(targetCategories) ? targetCategories : JSON.parse(targetCategories)) : [],
      targetTags: targetTags ? (Array.isArray(targetTags) ? targetTags : JSON.parse(targetTags)) : [],
      targetLocations: targetLocations ? (Array.isArray(targetLocations) ? targetLocations : JSON.parse(targetLocations)) : [],
      targetAudience: targetAudience || 'all',
      promotionType: promotionType || 'standard',
    });

    ApiResponse.created(res, ad, 'Advertisement created. Pending approval.');
  } catch (error) {
    next(error);
  }
};

exports.createAdFromWallet = async (req, res, next) => {
  try {
    const {
      title, description, redirectUrl, placement, campaign,
      targetCategories, targetTags, targetLocations, targetAudience,
      promotionType,
    } = req.body;

    const parsedCampaign = campaign ? (typeof campaign === 'string' ? JSON.parse(campaign) : campaign) : {};
    const budget = parsedCampaign.budget || 0;

    if (budget <= 0) {
      return ApiResponse.error(res, 'Budget must be greater than 0', 400);
    }

    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id });
    }
    if (wallet.balance < budget) {
      return ApiResponse.error(res, `Insufficient wallet balance. Need ${budget}, have ${wallet.balance}`, 400);
    }

    let image;
    if (req.file) {
      const result = await uploadImageToGridFS(req.file.buffer, req.file.originalname, req.file.mimetype);
      image = { url: result.url, fileId: result.fileId, width: result.width, height: result.height };
    }

    const ad = await Advertisement.create({
      title,
      description,
      redirectUrl,
      image: image || undefined,
      advertiser: req.user._id,
      placement: placement || 'feed',
      campaign: parsedCampaign,
      targetCategories: targetCategories ? (Array.isArray(targetCategories) ? targetCategories : JSON.parse(targetCategories)) : [],
      targetTags: targetTags ? (Array.isArray(targetTags) ? targetTags : JSON.parse(targetTags)) : [],
      targetLocations: targetLocations ? (Array.isArray(targetLocations) ? targetLocations : JSON.parse(targetLocations)) : [],
      targetAudience: targetAudience || 'all',
      promotionType: promotionType || 'standard',
      isPaid: true,
      status: 'pending',
    });

    await wallet.debit(budget, `Ad campaign: ${title}`, ad._id.toString());

    await Payment.create({
      user: req.user._id,
      type: 'ad_payment',
      amount: budget,
      currency: parsedCampaign.currency || 'USD',
      gateway: 'manual',
      advertisement: ad._id,
      description: `Wallet payment for ad: ${title}`,
      status: 'completed',
      paidAt: new Date(),
    });

    ApiResponse.created(res, ad, 'Ad created and paid from wallet. Pending approval.');
  } catch (error) {
    next(error);
  }
};

exports.getMyAds = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search, sort = 'createdAt' } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = { advertiser: req.user._id };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const sortMap = {
      createdAt: { createdAt: -1 },
      clicks: { clicks: -1 },
      impressions: { impressions: -1 },
      spent: { 'campaign.spent': -1 },
      budget: { 'campaign.budget': -1 },
    };

    const [ads, total] = await Promise.all([
      Advertisement.find(filter)
        .sort(sortMap[sort] || { createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Advertisement.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, ads, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.getAd = async (req, res, next) => {
  try {
    const ad = await Advertisement.findById(req.params.id)
      .populate('advertiser', 'username displayName avatar')
      .populate('targetCategories', 'name slug');
    if (!ad) return ApiResponse.notFound(res, 'Advertisement not found');
    ApiResponse.success(res, ad);
  } catch (error) {
    next(error);
  }
};

exports.updateAd = async (req, res, next) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return ApiResponse.notFound(res, 'Advertisement not found');

    if (ad.advertiser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, 'Not authorized');
    }

    const {
      title, description, redirectUrl, placement, campaign, status,
      targetCategories, targetTags, targetLocations, targetAudience, promotionType,
    } = req.body;

    if (title) ad.title = title;
    if (description !== undefined) ad.description = description;
    if (redirectUrl) ad.redirectUrl = redirectUrl;
    if (placement) ad.placement = placement;
    if (campaign) ad.campaign = typeof campaign === 'string' ? JSON.parse(campaign) : campaign;
    if (status && req.user.role === 'admin') ad.status = status;
    if (targetCategories) ad.targetCategories = Array.isArray(targetCategories) ? targetCategories : JSON.parse(targetCategories);
    if (targetTags) ad.targetTags = Array.isArray(targetTags) ? targetTags : JSON.parse(targetTags);
    if (targetLocations) ad.targetLocations = Array.isArray(targetLocations) ? targetLocations : JSON.parse(targetLocations);
    if (targetAudience) ad.targetAudience = targetAudience;
    if (promotionType) ad.promotionType = promotionType;

    if (req.file) {
      const result = await uploadImageToGridFS(req.file.buffer, req.file.originalname, req.file.mimetype);
      ad.image = { url: result.url, fileId: result.fileId, width: result.width, height: result.height };
    }

    await ad.save();
    ApiResponse.success(res, ad, 'Advertisement updated');
  } catch (error) {
    next(error);
  }
};

exports.deleteAd = async (req, res, next) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return ApiResponse.notFound(res, 'Advertisement not found');

    if (ad.advertiser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, 'Not authorized');
    }

    await ad.deleteOne();
    ApiResponse.success(res, null, 'Advertisement deleted');
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// TRACKING
// ──────────────────────────────────────────────

exports.trackAdClick = async (req, res, next) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return ApiResponse.notFound(res, 'Advertisement not found');

    const result = await adTrackingService.trackClick(ad._id, {
      userId: req.user?._id,
      sessionId: req.headers['x-session-id'] || '',
      ip: req.ip,
      userAgent: req.headers['user-agent'] || '',
      referrer: req.headers.referer || '',
    });

    ApiResponse.success(res, { redirectUrl: ad.redirectUrl, ...result }, 'Click tracked');
  } catch (error) {
    next(error);
  }
};

exports.trackImpression = async (req, res, next) => {
  try {
    const result = await adTrackingService.trackImpression(req.params.id, {
      userId: req.user?._id,
      sessionId: req.headers['x-session-id'] || '',
      ip: req.ip,
      userAgent: req.headers['user-agent'] || '',
      placement: req.body.placement || '',
    });

    ApiResponse.success(res, result, 'Impression tracked');
  } catch (error) {
    next(error);
  }
};

exports.trackView = async (req, res, next) => {
  try {
    const result = await adTrackingService.trackView(req.params.id, {
      userId: req.user?._id,
      sessionId: req.headers['x-session-id'] || '',
    });
    ApiResponse.success(res, result, 'View tracked');
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// FEED
// ──────────────────────────────────────────────

exports.getActiveAds = async (req, res, next) => {
  try {
    const { placement = 'feed', limit = 5 } = req.query;
    const now = new Date();

    const ads = await Advertisement.find({
      status: 'active',
      isPaid: true,
      placement,
      'campaign.startDate': { $lte: now },
      $or: [
        { 'campaign.endDate': { $gte: now } },
        { 'campaign.endDate': null },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('advertiser', 'username displayName avatar')
      .lean();

    ApiResponse.success(res, ads);
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// ANALYTICS
// ──────────────────────────────────────────────

exports.getAdAnalytics = async (req, res, next) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return ApiResponse.notFound(res, 'Advertisement not found');

    if (ad.advertiser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, 'Not authorized');
    }

    const { startDate, endDate } = req.query;
    const eventAnalytics = await adTrackingService.getAdEventAnalytics(ad._id, { startDate, endDate });

    ApiResponse.success(res, {
      ad: {
        _id: ad._id,
        title: ad.title,
        status: ad.status,
        placement: ad.placement,
        promotionType: ad.promotionType,
        campaign: ad.campaign,
        createdAt: ad.createdAt,
      },
      totals: {
        impressions: ad.impressions,
        clicks: ad.clicks,
        likes: ad.likes,
        shares: ad.shares,
        views: ad.views,
        ctr: ad.impressions > 0 ? parseFloat(((ad.clicks / ad.impressions) * 100).toFixed(2)) : 0,
        budget: ad.campaign.budget,
        spent: ad.campaign.spent,
      },
      dailyStats: ad.dailyStats || [],
      eventAnalytics,
    });
  } catch (error) {
    next(error);
  }
};

exports.getEarnings = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { period = '30d' } = req.query;
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [revenueTimeline, campaignPerformance, totalStats] = await Promise.all([
      Payment.aggregate([
        {
          $match: {
            user: userId,
            type: 'ad_payment',
            status: 'completed',
            paidAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
            amount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Advertisement.aggregate([
        { $match: { advertiser: userId } },
        {
          $project: {
            title: 1, status: 1, impressions: 1, clicks: 1, views: 1,
            budget: '$campaign.budget', spent: '$campaign.spent', ctr: 1,
            roi: {
              $cond: [
                { $gt: ['$campaign.spent', 0] },
                { $multiply: [{ $divide: ['$clicks', '$campaign.spent'] }, 100] },
                0,
              ],
            },
          },
        },
        { $sort: { clicks: -1 } },
        { $limit: 10 },
      ]),
      Advertisement.aggregate([
        { $match: { advertiser: userId } },
        {
          $group: {
            _id: null,
            totalBudget: { $sum: '$campaign.budget' },
            totalSpent: { $sum: '$campaign.spent' },
            totalClicks: { $sum: '$clicks' },
            totalImpressions: { $sum: '$impressions' },
          },
        },
      ]),
    ]);

    const stats = totalStats[0] || { totalBudget: 0, totalSpent: 0, totalClicks: 0, totalImpressions: 0 };

    ApiResponse.success(res, {
      revenueTimeline: revenueTimeline.map((r) => ({ date: r._id, amount: parseFloat(r.amount.toFixed(2)), count: r.count })),
      campaignPerformance: campaignPerformance.map((c) => ({
        ...c, spent: parseFloat((c.spent || 0).toFixed(2)), roi: parseFloat((c.roi || 0).toFixed(2)),
      })),
      totals: {
        totalBudget: parseFloat(stats.totalBudget.toFixed(2)),
        totalSpent: parseFloat(stats.totalSpent.toFixed(2)),
        totalClicks: stats.totalClicks,
        totalImpressions: stats.totalImpressions,
        avgCPC: stats.totalClicks > 0 ? parseFloat((stats.totalSpent / stats.totalClicks).toFixed(4)) : 0,
        avgCPM: stats.totalImpressions > 0 ? parseFloat(((stats.totalSpent / stats.totalImpressions) * 1000).toFixed(4)) : 0,
      },
      period,
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// ADMIN
// ──────────────────────────────────────────────

exports.getAllAds = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [ads, total] = await Promise.all([
      Advertisement.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('advertiser', 'username displayName avatar email')
        .lean(),
      Advertisement.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, ads, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.moderateAd = async (req, res, next) => {
  try {
    const { action } = req.body;
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return ApiResponse.notFound(res, 'Advertisement not found');

    switch (action) {
      case 'approve': ad.status = 'active'; break;
      case 'reject': ad.status = 'rejected'; break;
      case 'pause': ad.status = 'paused'; break;
      case 'resume': ad.status = 'active'; break;
      default: return ApiResponse.error(res, 'Invalid action', 400);
    }

    await ad.save();
    ApiResponse.success(res, ad, `Advertisement ${action}d`);
  } catch (error) {
    next(error);
  }
};

exports.getAdminAdStats = async (req, res, next) => {
  try {
    const [totalAds, statusCounts, totalRevenue, recentAds] = await Promise.all([
      Advertisement.countDocuments(),
      Advertisement.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Payment.aggregate([
        { $match: { type: 'ad_payment', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Advertisement.find().sort({ createdAt: -1 }).limit(10)
        .populate('advertiser', 'username displayName avatar').lean(),
    ]);

    const statusMap = {};
    statusCounts.forEach((s) => { statusMap[s._id] = s.count; });

    ApiResponse.success(res, { totalAds, statusBreakdown: statusMap, totalRevenue: totalRevenue[0]?.total || 0, recentAds });
  } catch (error) {
    next(error);
  }
};

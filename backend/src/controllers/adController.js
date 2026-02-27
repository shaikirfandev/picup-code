const Advertisement = require('../models/Advertisement');
const Payment = require('../models/Payment');
const Wallet = require('../models/Wallet');
const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');
const { uploadImageToGridFS } = require('../config/gridfs');

// Create advertisement
exports.createAd = async (req, res, next) => {
  try {
    const { title, description, redirectUrl, placement, campaign, targetCategories, targetTags } = req.body;

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
      campaign: campaign ? (typeof campaign === 'string' ? JSON.parse(campaign) : campaign) : undefined,
      targetCategories: targetCategories ? (Array.isArray(targetCategories) ? targetCategories : JSON.parse(targetCategories)) : [],
      targetTags: targetTags ? (Array.isArray(targetTags) ? targetTags : JSON.parse(targetTags)) : [],
    });

    ApiResponse.created(res, ad, 'Advertisement created. Pending approval.');
  } catch (error) {
    next(error);
  }
};

// Get my ads (advertiser)
exports.getMyAds = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = { advertiser: req.user._id };
    if (status) filter.status = status;

    const [ads, total] = await Promise.all([
      Advertisement.find(filter)
        .sort({ createdAt: -1 })
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

// Get single ad
exports.getAd = async (req, res, next) => {
  try {
    const ad = await Advertisement.findById(req.params.id)
      .populate('advertiser', 'username displayName avatar');
    if (!ad) return ApiResponse.notFound(res, 'Advertisement not found');
    ApiResponse.success(res, ad);
  } catch (error) {
    next(error);
  }
};

// Update ad
exports.updateAd = async (req, res, next) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return ApiResponse.notFound(res, 'Advertisement not found');

    if (ad.advertiser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, 'Not authorized');
    }

    const { title, description, redirectUrl, placement, campaign, status } = req.body;
    if (title) ad.title = title;
    if (description !== undefined) ad.description = description;
    if (redirectUrl) ad.redirectUrl = redirectUrl;
    if (placement) ad.placement = placement;
    if (campaign) ad.campaign = typeof campaign === 'string' ? JSON.parse(campaign) : campaign;
    if (status && req.user.role === 'admin') ad.status = status;

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

// Delete ad
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

// Track ad click (redirects to external URL)
exports.trackAdClick = async (req, res, next) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return ApiResponse.notFound(res, 'Advertisement not found');

    ad.clicks += 1;
    await ad.save();

    // Return the redirect URL - frontend handles the redirect
    ApiResponse.success(res, { redirectUrl: ad.redirectUrl }, 'Click tracked');
  } catch (error) {
    next(error);
  }
};

// Track ad impression
exports.trackImpression = async (req, res, next) => {
  try {
    await Advertisement.findByIdAndUpdate(req.params.id, { $inc: { impressions: 1 } });
    ApiResponse.success(res, null, 'Impression tracked');
  } catch (error) {
    next(error);
  }
};

// Get active ads for feed
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

// Get ad analytics (for advertiser)
exports.getAdAnalytics = async (req, res, next) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return ApiResponse.notFound(res, 'Advertisement not found');

    if (ad.advertiser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, 'Not authorized');
    }

    ApiResponse.success(res, {
      impressions: ad.impressions,
      clicks: ad.clicks,
      likes: ad.likes,
      shares: ad.shares,
      views: ad.views,
      ctr: ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : 0,
      budget: ad.campaign.budget,
      spent: ad.campaign.spent,
      status: ad.status,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all ads
exports.getAllAds = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = {};
    if (status) filter.status = status;

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

// Admin: Moderate ad
exports.moderateAd = async (req, res, next) => {
  try {
    const { action } = req.body; // approve, reject, pause
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return ApiResponse.notFound(res, 'Advertisement not found');

    switch (action) {
      case 'approve': ad.status = 'active'; break;
      case 'reject': ad.status = 'rejected'; break;
      case 'pause': ad.status = 'paused'; break;
      default: return ApiResponse.error(res, 'Invalid action', 400);
    }

    await ad.save();
    ApiResponse.success(res, ad, `Advertisement ${action}d`);
  } catch (error) {
    next(error);
  }
};

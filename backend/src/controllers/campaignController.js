const Campaign = require('../models/Campaign');
const AdGroup = require('../models/AdGroup');
const AdAccount = require('../models/AdAccount');
const CampaignDailyStats = require('../models/CampaignDailyStats');
const AdReportTemplate = require('../models/AdReportTemplate');
const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');
const { logActivity } = require('../services/adActivityService');
const { getRecommendations, estimateCampaign } = require('../services/adInsightService');

// ─── Campaign CRUD ───────────────────────────────────────────────────────────

exports.createCampaign = async (req, res) => {
  try {
    const {
      name, objective, budget, schedule, targetAudience,
      creatives, placement, tags, adAccountId,
    } = req.body;

    const campaign = await Campaign.create({
      name,
      owner: req.user._id,
      adAccount: adAccountId || null,
      objective,
      budget: budget || {},
      schedule: schedule || {},
      targetAudience: targetAudience || {},
      creatives: creatives || [],
      placement: placement || ['feed'],
      tags: tags || [],
      status: 'draft',
    });

    await logActivity({
      owner: req.user._id,
      actionType: 'CAMPAIGN_CREATED',
      entityType: 'Campaign',
      entityId: campaign._id,
      description: `Created campaign "${name}"`,
      req,
    });

    return ApiResponse.created(res, campaign, 'Campaign created');
  } catch (err) {
    console.error('createCampaign error:', err);
    return ApiResponse.error(res, err.message, 400);
  }
};

exports.getCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, sort = '-createdAt' } = req.query;
    const { skip } = paginate(req.query, page, limit);

    const filter = { owner: req.user._id };
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const [campaigns, total] = await Promise.all([
      Campaign.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
      Campaign.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, campaigns, getPaginationMeta(total, page, limit));
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.getCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return ApiResponse.notFound(res, 'Campaign not found');
    if (campaign.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res);
    }
    return ApiResponse.success(res, campaign);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return ApiResponse.notFound(res, 'Campaign not found');
    if (campaign.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res);
    }

    const oldBudget = campaign.budget?.total;
    const allowedFields = [
      'name', 'objective', 'budget', 'schedule', 'targetAudience',
      'creatives', 'placement', 'tags',
    ];
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) campaign[f] = req.body[f];
    });
    await campaign.save();

    // Log budget changes specifically
    if (req.body.budget && req.body.budget.total !== oldBudget) {
      await logActivity({
        owner: req.user._id,
        actionType: 'BUDGET_CHANGED',
        entityType: 'Campaign',
        entityId: campaign._id,
        description: `Budget changed from $${oldBudget} to $${req.body.budget.total}`,
        metadata: { oldBudget, newBudget: req.body.budget.total },
        req,
      });
    }

    await logActivity({
      owner: req.user._id,
      actionType: 'CAMPAIGN_UPDATED',
      entityType: 'Campaign',
      entityId: campaign._id,
      description: `Updated campaign "${campaign.name}"`,
      req,
    });

    return ApiResponse.success(res, campaign, 'Campaign updated');
  } catch (err) {
    return ApiResponse.error(res, err.message, 400);
  }
};

exports.pauseCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return ApiResponse.notFound(res, 'Campaign not found');
    if (campaign.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res);
    }

    const wasActive = campaign.status === 'active';
    campaign.status = campaign.status === 'paused' ? 'active' : 'paused';
    await campaign.save();

    await logActivity({
      owner: req.user._id,
      actionType: wasActive ? 'CAMPAIGN_PAUSED' : 'CAMPAIGN_RESUMED',
      entityType: 'Campaign',
      entityId: campaign._id,
      description: `${wasActive ? 'Paused' : 'Resumed'} campaign "${campaign.name}"`,
      req,
    });

    return ApiResponse.success(res, campaign, `Campaign ${campaign.status}`);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return ApiResponse.notFound(res, 'Campaign not found');
    if (campaign.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res);
    }

    await logActivity({
      owner: req.user._id,
      actionType: 'CAMPAIGN_DELETED',
      entityType: 'Campaign',
      entityId: campaign._id,
      description: `Deleted campaign "${campaign.name}"`,
      req,
    });

    await Campaign.findByIdAndDelete(req.params.id);
    // Also delete associated ad groups
    await AdGroup.deleteMany({ campaign: req.params.id });

    return ApiResponse.success(res, null, 'Campaign deleted');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

// ─── Ad Account Overview ─────────────────────────────────────────────────────

exports.getAccountOverview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = 'last30' } = req.query;

    let dateFilter = {};
    const now = new Date();
    if (period === 'last7') dateFilter = { createdAt: { $gte: new Date(now - 7 * 86400000) } };
    else if (period === 'last30') dateFilter = { createdAt: { $gte: new Date(now - 30 * 86400000) } };
    else if (period === 'last90') dateFilter = { createdAt: { $gte: new Date(now - 90 * 86400000) } };

    const filter = { owner: userId, ...dateFilter };

    const [campaigns, activeCampaigns, aggregateResult] = await Promise.all([
      Campaign.countDocuments({ owner: userId }),
      Campaign.countDocuments({ owner: userId, status: 'active' }),
      Campaign.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalSpend: { $sum: '$budget.spent' },
            totalImpressions: { $sum: '$metrics.impressions' },
            totalClicks: { $sum: '$metrics.clicks' },
            totalConversions: { $sum: '$metrics.conversions' },
            totalBudget: { $sum: '$budget.total' },
          },
        },
      ]),
    ]);

    const agg = aggregateResult[0] || {
      totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0, totalBudget: 0,
    };

    const ctr = agg.totalImpressions > 0
      ? parseFloat(((agg.totalClicks / agg.totalImpressions) * 100).toFixed(2))
      : 0;
    const roi = agg.totalSpend > 0
      ? parseFloat(((agg.totalConversions * 10 - agg.totalSpend) / agg.totalSpend).toFixed(2))
      : 0;

    return ApiResponse.success(res, {
      totalCampaigns: campaigns,
      activeCampaigns,
      adSpend: agg.totalSpend,
      impressions: agg.totalImpressions,
      clicks: agg.totalClicks,
      conversions: agg.totalConversions,
      ctr,
      roi,
      totalBudget: agg.totalBudget,
      period,
    });
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

// ─── Ad Reporting ────────────────────────────────────────────────────────────

exports.getCampaignReport = async (req, res) => {
  try {
    const { campaignId, startDate, endDate, adGroupId, groupBy = 'day' } = req.query;

    const filter = {};
    if (campaignId) filter.campaign = campaignId;
    if (adGroupId) filter.adGroup = adGroupId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Verify ownership
    if (campaignId) {
      const campaign = await Campaign.findById(campaignId);
      if (campaign && campaign.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return ApiResponse.forbidden(res);
      }
    }

    let groupByField;
    switch (groupBy) {
      case 'week':
        groupByField = { $week: '$date' };
        break;
      case 'month':
        groupByField = { $month: '$date' };
        break;
      case 'campaign':
        groupByField = '$campaign';
        break;
      case 'adGroup':
        groupByField = '$adGroup';
        break;
      default:
        groupByField = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
    }

    const report = await CampaignDailyStats.aggregate([
      { $match: filter },
      {
        $group: {
          _id: groupByField,
          impressions: { $sum: '$impressions' },
          reach: { $sum: '$reach' },
          clicks: { $sum: '$clicks' },
          conversions: { $sum: '$conversions' },
          engagement: { $sum: '$engagement' },
          spend: { $sum: '$spend' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Compute derived metrics
    const enriched = report.map((r) => ({
      ...r,
      ctr: r.impressions > 0 ? parseFloat(((r.clicks / r.impressions) * 100).toFixed(2)) : 0,
      cpc: r.clicks > 0 ? parseFloat((r.spend / r.clicks).toFixed(2)) : 0,
      costPerConversion: r.conversions > 0 ? parseFloat((r.spend / r.conversions).toFixed(2)) : 0,
    }));

    // Totals
    const totals = enriched.reduce(
      (acc, r) => {
        acc.impressions += r.impressions;
        acc.reach += r.reach;
        acc.clicks += r.clicks;
        acc.conversions += r.conversions;
        acc.engagement += r.engagement;
        acc.spend += r.spend;
        return acc;
      },
      { impressions: 0, reach: 0, clicks: 0, conversions: 0, engagement: 0, spend: 0 }
    );
    totals.ctr = totals.impressions > 0 ? parseFloat(((totals.clicks / totals.impressions) * 100).toFixed(2)) : 0;
    totals.cpc = totals.clicks > 0 ? parseFloat((totals.spend / totals.clicks).toFixed(2)) : 0;
    totals.costPerConversion = totals.conversions > 0 ? parseFloat((totals.spend / totals.conversions).toFixed(2)) : 0;

    return ApiResponse.success(res, { report: enriched, totals, groupBy });
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

// ─── Custom Ad Reports / Templates ──────────────────────────────────────────

exports.saveReportTemplate = async (req, res) => {
  try {
    const { name, description, metrics, filters, groupBy, exportFormat } = req.body;

    const template = await AdReportTemplate.create({
      name,
      owner: req.user._id,
      description,
      metrics,
      filters,
      groupBy,
      exportFormat,
    });

    await logActivity({
      owner: req.user._id,
      actionType: 'TEMPLATE_SAVED',
      entityType: 'AdReportTemplate',
      entityId: template._id,
      description: `Saved report template "${name}"`,
      req,
    });

    return ApiResponse.created(res, template, 'Report template saved');
  } catch (err) {
    return ApiResponse.error(res, err.message, 400);
  }
};

exports.getReportTemplates = async (req, res) => {
  try {
    const templates = await AdReportTemplate.find({ owner: req.user._id }).sort('-createdAt');
    return ApiResponse.success(res, templates);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.deleteReportTemplate = async (req, res) => {
  try {
    const template = await AdReportTemplate.findById(req.params.id);
    if (!template) return ApiResponse.notFound(res);
    if (template.owner.toString() !== req.user._id.toString()) return ApiResponse.forbidden(res);
    await AdReportTemplate.findByIdAndDelete(req.params.id);
    return ApiResponse.success(res, null, 'Template deleted');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.exportReport = async (req, res) => {
  try {
    const { campaignId, startDate, endDate, format = 'csv' } = req.query;

    const filter = {};
    if (campaignId) {
      filter.campaign = campaignId;
      const campaign = await Campaign.findById(campaignId);
      if (campaign && campaign.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return ApiResponse.forbidden(res);
      }
    }
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const stats = await CampaignDailyStats.find(filter).sort({ date: 1 }).populate('campaign', 'name');

    await logActivity({
      owner: req.user._id,
      actionType: 'REPORT_EXPORTED',
      entityType: 'Campaign',
      entityId: campaignId || null,
      description: `Exported report (${format})`,
      req,
    });

    if (format === 'csv') {
      const header = 'Date,Campaign,Impressions,Reach,Clicks,Conversions,Engagement,Spend,CTR,CPC\n';
      const rows = stats.map((s) => {
        const ctr = s.impressions > 0 ? ((s.clicks / s.impressions) * 100).toFixed(2) : 0;
        const cpc = s.clicks > 0 ? (s.spend / s.clicks).toFixed(2) : 0;
        return `${s.date.toISOString().split('T')[0]},${s.campaign?.name || ''},${s.impressions},${s.reach},${s.clicks},${s.conversions},${s.engagement},${s.spend},${ctr},${cpc}`;
      });
      const csv = header + rows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=ad-report.csv');
      return res.send(csv);
    }

    // JSON fallback (PDF would require a library in production)
    return ApiResponse.success(res, stats);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

// ─── Ad Recommendations ─────────────────────────────────────────────────────

exports.getAdRecommendations = async (req, res) => {
  try {
    const recommendations = await getRecommendations(req.user._id);
    return ApiResponse.success(res, recommendations);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

// ─── Media Planner ──────────────────────────────────────────────────────────

exports.estimateMediaPlan = async (req, res) => {
  try {
    const { budget, audience, duration, placement } = req.body;
    if (!budget || !duration) {
      return ApiResponse.error(res, 'Budget and duration are required', 400);
    }
    const estimate = estimateCampaign({ budget, audience, duration, placement });
    return ApiResponse.success(res, estimate);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

// ─── Bulk Editor ─────────────────────────────────────────────────────────────

exports.bulkUpdateCampaigns = async (req, res) => {
  try {
    const { campaignIds, updates } = req.body;
    if (!Array.isArray(campaignIds) || campaignIds.length === 0) {
      return ApiResponse.error(res, 'campaignIds array required', 400);
    }

    // Only allow the owner's campaigns
    const campaigns = await Campaign.find({
      _id: { $in: campaignIds },
      owner: req.user._id,
    });
    if (campaigns.length === 0) return ApiResponse.notFound(res, 'No matching campaigns found');

    const allowedBulkFields = ['status', 'budget', 'schedule', 'targetAudience', 'placement'];
    const safeUpdates = {};
    allowedBulkFields.forEach((f) => {
      if (updates[f] !== undefined) safeUpdates[f] = updates[f];
    });

    const result = await Campaign.updateMany(
      { _id: { $in: campaigns.map((c) => c._id) } },
      { $set: safeUpdates }
    );

    await logActivity({
      owner: req.user._id,
      actionType: 'BULK_EDIT',
      entityType: 'Campaign',
      description: `Bulk updated ${result.modifiedCount} campaigns`,
      metadata: { campaignIds, fields: Object.keys(safeUpdates) },
      req,
    });

    return ApiResponse.success(res, { modified: result.modifiedCount }, 'Bulk update complete');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { campaignIds, status } = req.body;
    if (!Array.isArray(campaignIds) || !status) {
      return ApiResponse.error(res, 'campaignIds and status required', 400);
    }

    const validStatuses = ['active', 'paused', 'archived', 'draft'];
    if (!validStatuses.includes(status)) {
      return ApiResponse.error(res, 'Invalid status', 400);
    }

    const result = await Campaign.updateMany(
      { _id: { $in: campaignIds }, owner: req.user._id },
      { $set: { status } }
    );

    await logActivity({
      owner: req.user._id,
      actionType: 'BULK_EDIT',
      entityType: 'Campaign',
      description: `Bulk status change to "${status}" for ${result.modifiedCount} campaigns`,
      metadata: { campaignIds, status },
      req,
    });

    return ApiResponse.success(res, { modified: result.modifiedCount }, 'Bulk status update complete');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

// ─── Ad Groups ───────────────────────────────────────────────────────────────

exports.createAdGroup = async (req, res) => {
  try {
    const { name, campaignId, budget, targetAudience, placement } = req.body;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return ApiResponse.notFound(res, 'Campaign not found');
    if (campaign.owner.toString() !== req.user._id.toString()) return ApiResponse.forbidden(res);

    const adGroup = await AdGroup.create({
      name,
      campaign: campaignId,
      owner: req.user._id,
      budget,
      targetAudience,
      placement,
    });

    await logActivity({
      owner: req.user._id,
      actionType: 'AD_GROUP_CREATED',
      entityType: 'AdGroup',
      entityId: adGroup._id,
      description: `Created ad group "${name}" in campaign "${campaign.name}"`,
      req,
    });

    return ApiResponse.created(res, adGroup, 'Ad group created');
  } catch (err) {
    return ApiResponse.error(res, err.message, 400);
  }
};

exports.getAdGroups = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return ApiResponse.notFound(res, 'Campaign not found');
    if (campaign.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res);
    }

    const adGroups = await AdGroup.find({ campaign: campaignId }).sort('-createdAt');
    return ApiResponse.success(res, adGroups);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.updateAdGroup = async (req, res) => {
  try {
    const adGroup = await AdGroup.findById(req.params.id);
    if (!adGroup) return ApiResponse.notFound(res);
    if (adGroup.owner.toString() !== req.user._id.toString()) return ApiResponse.forbidden(res);

    const fields = ['name', 'budget', 'targetAudience', 'placement', 'status'];
    fields.forEach((f) => { if (req.body[f] !== undefined) adGroup[f] = req.body[f]; });
    await adGroup.save();

    await logActivity({
      owner: req.user._id,
      actionType: 'AD_GROUP_UPDATED',
      entityType: 'AdGroup',
      entityId: adGroup._id,
      description: `Updated ad group "${adGroup.name}"`,
      req,
    });

    return ApiResponse.success(res, adGroup, 'Ad group updated');
  } catch (err) {
    return ApiResponse.error(res, err.message, 400);
  }
};

exports.deleteAdGroup = async (req, res) => {
  try {
    const adGroup = await AdGroup.findById(req.params.id);
    if (!adGroup) return ApiResponse.notFound(res);
    if (adGroup.owner.toString() !== req.user._id.toString()) return ApiResponse.forbidden(res);

    await logActivity({
      owner: req.user._id,
      actionType: 'AD_GROUP_DELETED',
      entityType: 'AdGroup',
      entityId: adGroup._id,
      description: `Deleted ad group "${adGroup.name}"`,
      req,
    });

    await AdGroup.findByIdAndDelete(req.params.id);
    return ApiResponse.success(res, null, 'Ad group deleted');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

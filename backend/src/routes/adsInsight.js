const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { requirePaidAccount } = require('../middleware/paidUser');
const campaign = require('../controllers/campaignController');
const history = require('../controllers/adHistoryController');

// All routes require authentication + paid account
router.use(authenticate, requirePaidAccount);

// ─── Campaign CRUD ───────────────────────────────────────────────────────────
router.post('/campaigns', campaign.createCampaign);
router.get('/campaigns', campaign.getCampaigns);
router.get('/campaigns/:id', campaign.getCampaign);
router.put('/campaigns/:id', campaign.updateCampaign);
router.patch('/campaigns/:id/toggle-pause', campaign.pauseCampaign);
router.delete('/campaigns/:id', campaign.deleteCampaign);

// ─── Ad Groups ───────────────────────────────────────────────────────────────
router.post('/ad-groups', campaign.createAdGroup);
router.get('/ad-groups/campaign/:campaignId', campaign.getAdGroups);
router.put('/ad-groups/:id', campaign.updateAdGroup);
router.delete('/ad-groups/:id', campaign.deleteAdGroup);

// ─── Account Overview & Reporting ────────────────────────────────────────────
router.get('/overview', campaign.getAccountOverview);
router.get('/reports', campaign.getCampaignReport);
router.get('/reports/export', campaign.exportReport);

// ─── Custom Report Templates ─────────────────────────────────────────────────
router.post('/report-templates', campaign.saveReportTemplate);
router.get('/report-templates', campaign.getReportTemplates);
router.delete('/report-templates/:id', campaign.deleteReportTemplate);

// ─── AI Recommendations ─────────────────────────────────────────────────────
router.get('/recommendations', campaign.getAdRecommendations);

// ─── Media Planner ──────────────────────────────────────────────────────────
router.post('/media-planner/estimate', campaign.estimateMediaPlan);

// ─── Bulk Editor ─────────────────────────────────────────────────────────────
router.put('/bulk/campaigns', campaign.bulkUpdateCampaigns);
router.put('/bulk/status', campaign.bulkUpdateStatus);

// ─── Activity History / Timeline ─────────────────────────────────────────────
router.get('/history', history.getActivityTimeline);
router.get('/history/stats', history.getActivityStats);

module.exports = router;

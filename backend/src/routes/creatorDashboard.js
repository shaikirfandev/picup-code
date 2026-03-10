const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middleware/auth');
const CreatorDashboardController = require('../controllers/creatorDashboardController');

// Rate limiters
const dashboardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many dashboard requests. Please slow down.' },
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many write requests. Please slow down.' },
});

// All routes require authentication
router.use(authenticate);

// ─── Overview ──────────────────────────────────────────────────
router.get('/overview', dashboardLimiter, CreatorDashboardController.getOverview);

// ─── Content Performance ───────────────────────────────────────
router.get('/content-performance', dashboardLimiter, CreatorDashboardController.getContentPerformance);
router.get('/performance-heatmap', dashboardLimiter, CreatorDashboardController.getPerformanceHeatmap);
router.get('/engagement-trends', dashboardLimiter, CreatorDashboardController.getEngagementTrends);

// ─── Audience Insights ─────────────────────────────────────────
router.get('/audience-insights', dashboardLimiter, CreatorDashboardController.getAudienceInsights);

// ─── Monetization ──────────────────────────────────────────────
router.get('/monetization', dashboardLimiter, CreatorDashboardController.getMonetization);
router.post('/monetization/enable', writeLimiter, CreatorDashboardController.enableMonetization);

// ─── Content Management ────────────────────────────────────────
router.get('/content', dashboardLimiter, CreatorDashboardController.getContentManagement);
router.post('/content/schedule', writeLimiter, CreatorDashboardController.schedulePost);
router.delete('/content/schedule/:id', writeLimiter, CreatorDashboardController.cancelScheduledPost);
router.patch('/content/:postId/pin', writeLimiter, CreatorDashboardController.togglePinPost);
router.post('/content/bulk', writeLimiter, CreatorDashboardController.bulkUpdatePosts);

// ─── AI / Growth Insights ──────────────────────────────────────
router.get('/growth-insights', dashboardLimiter, CreatorDashboardController.getGrowthInsights);

// ─── Activity Feed ─────────────────────────────────────────────
router.get('/activity', dashboardLimiter, CreatorDashboardController.getActivityFeed);
router.post('/activity/read', writeLimiter, CreatorDashboardController.markActivityRead);

// ─── Creator Profile / Settings ────────────────────────────────
router.get('/profile', dashboardLimiter, CreatorDashboardController.getCreatorProfile);
router.put('/profile', writeLimiter, CreatorDashboardController.updateCreatorProfile);

// ─── Comment Moderation ────────────────────────────────────────
router.get('/comments', dashboardLimiter, CreatorDashboardController.getCommentsForModeration);
router.post('/comments/:commentId/moderate', writeLimiter, CreatorDashboardController.moderateComment);

module.exports = router;

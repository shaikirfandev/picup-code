const router = require('express').Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const rateLimit = require('express-rate-limit');

// Rate limit for analytics APIs (heavier queries)
const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// All routes require auth + admin
router.use(authenticate);
router.use(isAdmin);
router.use(analyticsLimiter);

// Overview stats card data
router.get('/stats/overview', analyticsController.getOverview);

// Daily login chart + login metrics
router.get('/stats/logins', analyticsController.getLoginStats);

// User management list with analytics
router.get('/users', analyticsController.getUsersList);

// CSV export (admin-only, audit-logged)
router.get('/users/export', analyticsController.exportUsers);

// Top users by metric
router.get('/users/top', analyticsController.getTopUsers);

// Recent activity feed
router.get('/activity/recent', analyticsController.getRecentActivity);

// Manual stats computation trigger
router.post('/stats/compute', analyticsController.triggerCompute);

module.exports = router;

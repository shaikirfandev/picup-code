/**
 * Creator Analytics Routes
 * 
 * /api/creator-analytics/*
 * 
 * Most endpoints require: authenticate + requirePaidAccount
 * Event tracking endpoint: optionalAuth (for anonymous view tracking)
 */
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { authenticate, optionalAuth } = require('../middleware/auth');
const { requirePaidAccount } = require('../middleware/paidUser');
const ctrl = require('../controllers/creatorAnalyticsController');

// ── Rate Limiters ────────────────────────────────────────────────────────────
const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  message: {
    success: false,
    message: 'Too many analytics requests. Please slow down.',
  },
});

const trackingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120, // Higher limit for tracking events
  message: {
    success: false,
    message: 'Event tracking rate limit exceeded.',
  },
});

const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    message: 'Export rate limit exceeded. Please try again later.',
  },
});

// ── Public: Event Tracking (supports anonymous) ──────────────────────────────
router.post('/track', trackingLimiter, optionalAuth, ctrl.trackPostEvent);

// ── Auth Required: Access Check ──────────────────────────────────────────────
router.get('/access', authenticate, ctrl.checkAccess);

// ── Paid Required: Dashboard Endpoints ───────────────────────────────────────
router.use(authenticate, requirePaidAccount, analyticsLimiter);

// Overview
router.get('/overview', ctrl.getOverview);

// Engagement timeline
router.get('/timeline', ctrl.getTimeline);

// Follower growth
router.get('/followers', ctrl.getFollowers);

// Posts performance table
router.get('/posts', ctrl.getPostsTable);

// Single post analytics
router.get('/posts/:postId', ctrl.getSinglePostAnalytics);

// Affiliate analytics
router.get('/affiliate', ctrl.getAffiliate);

// Audience insights
router.get('/audience', ctrl.getAudience);

// AI insights
router.get('/ai-insights', ctrl.getAI);

// Real-time
router.get('/realtime', ctrl.getRealtimeStats);
router.get('/realtime/:postId', ctrl.getRealtimePostStats);

// Export
router.get('/export/csv', exportLimiter, ctrl.exportCSV);

module.exports = router;

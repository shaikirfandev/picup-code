const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { optionalPaidCheck, requirePaidAccount } = require('../middleware/paidUser');
const affiliateController = require('../controllers/affiliateController');

// ── Routes accessible to ALL authenticated users ─────────────────────────────

// Get user's affiliate posts (free users see posts but no detailed analytics)
router.get('/posts', authenticate, optionalPaidCheck, affiliateController.getMyAffiliatePosts);

// Get summary — basic for free users, detailed for paid users
router.get('/summary', authenticate, optionalPaidCheck, affiliateController.getAffiliateSummary);

// ── Routes accessible ONLY to paid users ─────────────────────────────────────

// Detailed per-post affiliate analytics (paid only)
router.get(
  '/posts/:postId/stats',
  authenticate,
  requirePaidAccount,
  affiliateController.getPostAffiliateStats
);

module.exports = router;

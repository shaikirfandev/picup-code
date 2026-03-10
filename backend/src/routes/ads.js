const router = require('express').Router();
const adController = require('../controllers/adController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { isAdmin, isModeratorOrAdmin } = require('../middleware/admin');
const { upload } = require('../middleware/upload');

// Public: get active ads for display
router.get('/active', adController.getActiveAds);

// Track events (no auth required)
router.post('/:id/click', optionalAuth, adController.trackAdClick);
router.post('/:id/impression', optionalAuth, adController.trackImpression);
router.post('/:id/view', optionalAuth, adController.trackView);

// Authenticated: dashboard & management
router.get('/dashboard', authenticate, adController.getDashboard);
router.get('/earnings', authenticate, adController.getEarnings);
router.post('/', authenticate, upload.single('image'), adController.createAd);
router.post('/wallet-create', authenticate, upload.single('image'), adController.createAdFromWallet);
router.get('/my', authenticate, adController.getMyAds);
router.get('/:id', authenticate, adController.getAd);
router.put('/:id', authenticate, upload.single('image'), adController.updateAd);
router.delete('/:id', authenticate, adController.deleteAd);
router.get('/:id/analytics', authenticate, adController.getAdAnalytics);

// Admin
router.get('/admin/all', authenticate, isAdmin, adController.getAllAds);
router.get('/admin/stats', authenticate, isAdmin, adController.getAdminAdStats);
router.put('/admin/:id/moderate', authenticate, isAdmin, adController.moderateAd);

module.exports = router;

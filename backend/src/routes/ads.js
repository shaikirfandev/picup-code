const router = require('express').Router();
const adController = require('../controllers/adController');
const { authenticate } = require('../middleware/auth');
const { isAdmin, isModeratorOrAdmin } = require('../middleware/admin');
const { upload } = require('../middleware/upload');

// Public: get active ads for display
router.get('/active', adController.getActiveAds);

// Track clicks (no auth required - users click ads)
router.post('/:id/click', adController.trackAdClick);
router.post('/:id/impression', adController.trackImpression);

// Authenticated: manage own ads
router.post('/', authenticate, upload.single('image'), adController.createAd);
router.get('/my', authenticate, adController.getMyAds);
router.get('/:id', authenticate, adController.getAd);
router.put('/:id', authenticate, upload.single('image'), adController.updateAd);
router.delete('/:id', authenticate, adController.deleteAd);
router.get('/:id/analytics', authenticate, adController.getAdAnalytics);

// Admin: manage all ads
router.get('/admin/all', authenticate, isAdmin, adController.getAllAds);
router.put('/admin/:id/moderate', authenticate, isAdmin, adController.moderateAd);

module.exports = router;

const router = require('express').Router();
const adController = require('../controllers/adController');
const { authenticate } = require('../middleware/auth');
const { isAdmin, isModeratorOrAdmin } = require('../middleware/admin');
const { upload } = require('../middleware/upload');
const { validateAd, validateAdUpdate, validateObjectId } = require('../middleware/validate');

// Public: get active ads for display
router.get('/active', adController.getActiveAds);

// Track clicks (no auth required - users click ads)
router.post('/:id/click', adController.trackAdClick);
router.post('/:id/impression', adController.trackImpression);

// Authenticated: manage own ads
router.post('/', authenticate, upload.single('image'), validateAd, adController.createAd);
router.get('/my', authenticate, adController.getMyAds);
router.get('/pricing', authenticate, adController.getAdPricing);
router.get('/:id', authenticate, adController.getAd);
router.put('/:id', authenticate, upload.single('image'), validateAdUpdate, adController.updateAd);
router.delete('/:id', authenticate, adController.deleteAd);
router.get('/:id/analytics', authenticate, adController.getAdAnalytics);

// Admin: manage all ads
router.get('/admin/all', authenticate, isAdmin, adController.getAllAds);
router.put('/admin/:id/moderate', authenticate, isAdmin, adController.moderateAd);
router.post('/admin/expire', authenticate, isAdmin, adController.expireAds);

module.exports = router;

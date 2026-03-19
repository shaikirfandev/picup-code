const router = require('express').Router();
const uploadController = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');
const { upload, videoWithThumbnailUpload } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.post('/image', authenticate, uploadLimiter, upload.single('image'), uploadController.uploadImage);
router.post('/images', authenticate, uploadLimiter, upload.array('images', 6), uploadController.uploadMultiple);
router.post('/video', authenticate, uploadLimiter, videoWithThumbnailUpload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), uploadController.uploadVideo);

module.exports = router;

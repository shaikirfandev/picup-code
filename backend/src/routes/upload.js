const router = require('express').Router();
const uploadController = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');
const { upload, videoUpload } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.post('/image', authenticate, uploadLimiter, upload.single('image'), uploadController.uploadImage);
router.post('/images', authenticate, uploadLimiter, upload.array('images', 5), uploadController.uploadMultiple);
router.post('/video', authenticate, uploadLimiter, videoUpload.single('video'), uploadController.uploadVideo);

module.exports = router;

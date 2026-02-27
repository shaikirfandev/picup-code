const router = require('express').Router();
const blogController = require('../controllers/blogController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { validateReport } = require('../middleware/validate');
const { reportLimiter } = require('../middleware/rateLimiter');

// Public routes
router.get('/', blogController.getBlogPosts);
router.get('/categories', blogController.getBlogCategories);

// Authenticated routes (must be BEFORE /:slug to avoid param catch)
router.get('/user/my-posts', authenticate, blogController.getMyBlogPosts);
router.post('/', authenticate, upload.single('coverImage'), blogController.createBlogPost);
router.put('/:id', authenticate, upload.single('coverImage'), blogController.updateBlogPost);
router.delete('/:id', authenticate, blogController.deleteBlogPost);
router.post('/:id/report', authenticate, reportLimiter, validateReport, blogController.reportBlogPost);

// Dynamic slug route (last — catches everything else)
router.get('/:slug', blogController.getBlogPost);

module.exports = router;

const router = require('express').Router();
const blogController = require('../controllers/blogController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Public routes
router.get('/', blogController.getBlogPosts);
router.get('/categories', blogController.getBlogCategories);
router.get('/:slug', blogController.getBlogPost);

// Authenticated routes
router.post('/', authenticate, upload.single('coverImage'), blogController.createBlogPost);
router.put('/:id', authenticate, upload.single('coverImage'), blogController.updateBlogPost);
router.delete('/:id', authenticate, blogController.deleteBlogPost);
router.get('/user/my-posts', authenticate, blogController.getMyBlogPosts);

module.exports = router;

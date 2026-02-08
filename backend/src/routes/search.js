const router = require('express').Router();
const searchController = require('../controllers/searchController');
const { optionalAuth } = require('../middleware/auth');
const { searchLimiter } = require('../middleware/rateLimiter');
const { validateSearch } = require('../middleware/validate');

router.get('/posts', searchLimiter, validateSearch, optionalAuth, searchController.searchPosts);
router.get('/users', searchLimiter, searchController.searchUsers);
router.get('/trending/tags', searchController.getTrendingTags);
router.get('/trending/posts', searchController.getTrendingPosts);

module.exports = router;

const router = require('express').Router();
const userController = require('../controllers/userController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/profile/:username', optionalAuth, userController.getUserProfile);
router.get('/profile/:username/posts', optionalAuth, userController.getUserPosts);
router.get('/profile/:username/followers', userController.getFollowers);
router.get('/profile/:username/following', userController.getFollowing);

router.put('/profile', authenticate, userController.updateProfile);
router.put('/avatar', authenticate, upload.single('avatar'), userController.uploadAvatar);

router.post('/:id/follow', authenticate, userController.followUser);
router.delete('/:id/follow', authenticate, userController.unfollowUser);

router.get('/suggested', authenticate, userController.getSuggestedUsers);

module.exports = router;

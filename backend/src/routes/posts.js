const router = require('express').Router();
const postController = require('../controllers/postController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { mediaUpload } = require('../middleware/upload');
const { validatePost, validateReport, validateObjectId } = require('../middleware/validate');

router.get('/feed', optionalAuth, postController.getFeed);
router.get('/saved', authenticate, postController.getSavedPosts);
router.get('/:id', optionalAuth, postController.getPost);

router.post('/', authenticate, mediaUpload.single('media'), validatePost, postController.createPost);
router.put('/:id', authenticate, postController.updatePost);
router.delete('/:id', authenticate, postController.deletePost);

router.post('/:id/like', authenticate, postController.toggleLike);
router.post('/:id/save', authenticate, postController.toggleSave);
router.post('/:id/click', postController.trackClick);
router.post('/:id/share', postController.sharePost);
router.post('/:id/report', authenticate, validateReport, postController.reportPost);

module.exports = router;

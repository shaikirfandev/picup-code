const router = require('express').Router();
const commentController = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');
const { validateComment } = require('../middleware/validate');

router.get('/post/:postId', commentController.getComments);
router.get('/:commentId/replies', commentController.getReplies);
router.post('/post/:postId', authenticate, validateComment, commentController.createComment);
router.put('/:id', authenticate, validateComment, commentController.updateComment);
router.delete('/:id', authenticate, commentController.deleteComment);

module.exports = router;

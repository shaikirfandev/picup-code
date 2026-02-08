const router = require('express').Router();
const boardController = require('../controllers/boardController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validateBoard } = require('../middleware/validate');

router.post('/', authenticate, validateBoard, boardController.createBoard);
router.get('/user/:userId', optionalAuth, boardController.getUserBoards);
router.get('/my', authenticate, boardController.getUserBoards);
router.get('/:id', optionalAuth, boardController.getBoard);
router.put('/:id', authenticate, boardController.updateBoard);
router.delete('/:id', authenticate, boardController.deleteBoard);
router.post('/:id/posts', authenticate, boardController.addToBoard);
router.delete('/:id/posts/:postId', authenticate, boardController.removeFromBoard);

module.exports = router;

const router = require('express').Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const { validateAIGenerate } = require('../middleware/validate');

router.post('/generate', authenticate, aiLimiter, validateAIGenerate, aiController.generateImage);
router.get('/generations', authenticate, aiController.getMyGenerations);
router.get('/generations/:id', authenticate, aiController.getGenerationStatus);
router.get('/styles', aiController.getStyles);

module.exports = router;

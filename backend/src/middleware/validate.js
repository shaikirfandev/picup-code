const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Auth validations
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('displayName').optional().trim().isLength({ max: 50 }),
  handleValidation,
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

// Post validations
const validatePost = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('Title is required and must be under 150 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be under 2000 characters'),
  body('productUrl')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('Please provide a valid product URL'),
  body('tags')
    .optional(),
  body('price.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  handleValidation,
];

// Comment validation
const validateComment = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be 1-1000 characters'),
  handleValidation,
];

// Board validation
const validateBoard = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Board name is required'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }),
  handleValidation,
];

// Search validation
const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Search query too long'),
  handleValidation,
];

// Report validation
const validateReport = [
  body('reason')
    .isIn(['spam', 'nsfw', 'nudity', 'violence', 'harassment', 'hate_speech', 'abuse', 'misinformation', 'copyright', 'other'])
    .withMessage('Invalid report reason'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }),
  handleValidation,
];

// Category validation
const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category name is required'),
  handleValidation,
];

// ObjectId param validation
const validateObjectId = [
  param('id').isMongoId().withMessage('Invalid ID'),
  handleValidation,
];

// ── Ad validation ────────────────────────────────────────────────────────────
const validateAd = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('Ad title is required and must be under 150 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be under 2000 characters'),
  body('targetUrl')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('Please provide a valid target URL'),
  body('adType')
    .optional()
    .isIn(['banner', 'feed', 'sponsored', 'popup', 'sidebar'])
    .withMessage('Invalid ad type'),
  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  handleValidation,
];

const validateAdUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('Ad title must be under 150 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }),
  body('targetUrl')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('Please provide a valid target URL'),
  handleValidation,
];

// ── Wallet / Payment validation ──────────────────────────────────────────────
const validateWalletTopup = [
  body('amount')
    .isFloat({ min: 1, max: 100000 })
    .withMessage('Amount must be between 1 and 100,000'),
  body('currency')
    .optional()
    .isIn(['USD', 'INR', 'EUR', 'GBP'])
    .withMessage('Invalid currency'),
  handleValidation,
];

const validateDeductCredits = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be positive'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason too long'),
  handleValidation,
];

const validatePaymentCreate = [
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be at least 1'),
  body('method')
    .optional()
    .isIn(['razorpay', 'stripe'])
    .withMessage('Invalid payment method'),
  handleValidation,
];

// ── AI prompt validation ─────────────────────────────────────────────────────
const validateAIGenerate = [
  body('prompt')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Prompt must be 1-1000 characters')
    .matches(/^[^<>{}]*$/)
    .withMessage('Prompt contains invalid characters'),
  body('style')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Style name too long'),
  body('width')
    .optional()
    .isInt({ min: 128, max: 2048 })
    .withMessage('Width must be 128-2048'),
  body('height')
    .optional()
    .isInt({ min: 128, max: 2048 })
    .withMessage('Height must be 128-2048'),
  handleValidation,
];

// ── User profile update validation ───────────────────────────────────────────
const validateProfileUpdate = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Display name must be 1-50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be under 500 characters'),
  body('website')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('Please provide a valid website URL'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 }),
  handleValidation,
];

// ── Business validation ──────────────────────────────────────────────────────
const validateBusiness = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Business name is required'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }),
  body('website')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('Please provide a valid website URL'),
  handleValidation,
];

// ── Admin moderation validation ──────────────────────────────────────────────
const validateAdminModerate = [
  body('action')
    .isIn(['approve', 'reject', 'suspend', 'ban', 'warn', 'delete'])
    .withMessage('Invalid moderation action'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }),
  handleValidation,
];

module.exports = {
  handleValidation,
  validateRegister,
  validateLogin,
  validatePost,
  validateComment,
  validateBoard,
  validateSearch,
  validateReport,
  validateCategory,
  validateObjectId,
  validateAd,
  validateAdUpdate,
  validateWalletTopup,
  validateDeductCredits,
  validatePaymentCreate,
  validateAIGenerate,
  validateProfileUpdate,
  validateBusiness,
  validateAdminModerate,
};

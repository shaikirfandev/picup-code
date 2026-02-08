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
    .isIn(['spam', 'nsfw', 'harassment', 'misinformation', 'copyright', 'other'])
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
};

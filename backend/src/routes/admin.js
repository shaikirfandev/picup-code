const router = require('express').Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { isAdmin, isModeratorOrAdmin } = require('../middleware/admin');

// All admin routes require authentication + admin/moderator role
router.use(authenticate);

// Dashboard
router.get('/dashboard', isAdmin, adminController.getDashboard);

// User management
router.get('/users', isModeratorOrAdmin, adminController.getUsers);
router.put('/users/:id/role', isAdmin, adminController.updateUserRole);
router.put('/users/:id/status', isModeratorOrAdmin, adminController.updateUserStatus);
router.put('/users/:id/verify', isModeratorOrAdmin, adminController.verifyUser);

// Content moderation
router.get('/posts', isModeratorOrAdmin, adminController.getPosts);
router.put('/posts/:id/moderate', isModeratorOrAdmin, adminController.moderatePost);

// Reports
router.get('/reports', isModeratorOrAdmin, adminController.getReports);
router.put('/reports/:id', isModeratorOrAdmin, adminController.resolveReport);

// Categories
router.post('/categories', isAdmin, adminController.createCategory);
router.put('/categories/:id', isAdmin, adminController.updateCategory);
router.delete('/categories/:id', isAdmin, adminController.deleteCategory);

// AI management
router.get('/ai/logs', isAdmin, adminController.getAiLogs);
router.put('/ai/users/:id/limit', isAdmin, adminController.setUserAiLimit);

module.exports = router;

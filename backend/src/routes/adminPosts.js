const router = require('express').Router();
const adminPostController = require('../controllers/adminPostController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

// All routes require auth + admin
router.use(authenticate, isAdmin);

// Enhanced post listing with soft-delete + search + sort
router.get('/', adminPostController.getAdminPosts);

// Bulk delete (must be before /:id to avoid route conflict)
router.post('/bulk-delete', adminPostController.bulkDeletePosts);

// Single post delete
router.delete('/:id', adminPostController.deletePost);

// Restore soft-deleted post
router.patch('/:id/restore', adminPostController.restorePost);

// Audit logs
router.get('/audit-logs', adminPostController.getAuditLogs);

module.exports = router;

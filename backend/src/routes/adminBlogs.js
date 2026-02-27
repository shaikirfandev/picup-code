const router = require('express').Router();
const adminBlogController = require('../controllers/adminBlogController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

// All routes require auth + admin
router.use(authenticate, isAdmin);

// Enhanced blog post listing with soft-delete + search + sort
router.get('/', adminBlogController.getAdminBlogPosts);

// Bulk delete (must be before /:id to avoid route conflict)
router.post('/bulk-delete', adminBlogController.bulkDeleteBlogPosts);

// Single blog post delete
router.delete('/:id', adminBlogController.deleteBlogPost);

// Restore soft-deleted blog post
router.patch('/:id/restore', adminBlogController.restoreBlogPost);

// Blog audit logs
router.get('/audit-logs', adminBlogController.getBlogAuditLogs);

module.exports = router;

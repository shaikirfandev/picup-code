const notificationService = require('../services/notificationService');
const { ApiResponse, getPaginationMeta } = require('../utils/apiResponse');

// GET /api/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const { notifications, pagination } = await notificationService.getUserNotifications(
      req.user._id,
      { page: parseInt(page), limit: parseInt(limit), unreadOnly: unreadOnly === 'true' }
    );
    ApiResponse.paginated(res, notifications, pagination);
  } catch (error) {
    next(error);
  }
};

// GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);
    ApiResponse.success(res, { count });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);
    if (!notification) {
      return ApiResponse.notFound(res, 'Notification not found');
    }
    ApiResponse.success(res, notification, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/mark-all-read
exports.markAllAsRead = async (req, res, next) => {
  try {
    const count = await notificationService.markAllAsRead(req.user._id);
    ApiResponse.success(res, { markedCount: count }, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await notificationService.deleteNotification(req.params.id, req.user._id);
    if (!notification) {
      return ApiResponse.notFound(res, 'Notification not found');
    }
    ApiResponse.success(res, null, 'Notification deleted');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notifications/clear-all
exports.clearAll = async (req, res, next) => {
  try {
    const count = await notificationService.clearAll(req.user._id);
    ApiResponse.success(res, { deletedCount: count }, 'All notifications cleared');
  } catch (error) {
    next(error);
  }
};

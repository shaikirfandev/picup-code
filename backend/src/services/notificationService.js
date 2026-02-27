const Notification = require('../models/Notification');

// In-memory reference to Socket.io instance (set from server.js)
let io = null;

/**
 * Set the Socket.io server instance so the service can emit events.
 */
function setIO(socketIO) {
  io = socketIO;
}

/**
 * Emit a real-time notification to the recipient's personal room.
 */
function emitToUser(userId, event, data) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

/**
 * Create a notification with deduplication and self-notification prevention.
 *
 * @param {Object} opts
 * @param {string} opts.recipient  - ObjectId of the user to notify
 * @param {string} [opts.sender]   - ObjectId of the user who triggered the action
 * @param {string} opts.type       - Notification type enum
 * @param {string} [opts.post]     - Related post ObjectId
 * @param {string} [opts.comment]  - Related comment ObjectId
 * @param {string} [opts.message]  - Human-readable message
 * @param {Object} [opts.metadata] - Any extra data
 * @returns {Promise<Object|null>} The created notification or null if skipped
 */
async function createNotification({ recipient, sender, type, post, comment, message, metadata }) {
  // Never notify yourself
  if (sender && recipient && sender.toString() === recipient.toString()) {
    return null;
  }

  // Deduplicate: skip if same (recipient, sender, type, post) exists within last 5 minutes
  if (sender && post) {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const duplicate = await Notification.findOne({
      recipient,
      sender,
      type,
      post,
      createdAt: { $gte: fiveMinAgo },
    });
    if (duplicate) return null;
  }

  const notification = await Notification.create({
    recipient,
    sender: sender || undefined,
    type,
    post: post || undefined,
    comment: comment || undefined,
    message,
    metadata: metadata || {},
  });

  // Populate sender for the real-time payload
  const populated = await Notification.findById(notification._id)
    .populate('sender', 'username displayName avatar')
    .populate('post', 'title slug image')
    .lean();

  // Push real-time event
  emitToUser(recipient.toString(), 'new-notification', populated);

  return populated;
}

/**
 * Get paginated notifications for a user.
 */
async function getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
  const filter = { recipient: userId };
  if (unreadOnly) filter.isRead = false;

  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username displayName avatar')
      .populate('post', 'title slug image')
      .lean(),
    Notification.countDocuments(filter),
  ]);

  return {
    notifications,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      hasMore: skip + notifications.length < total,
    },
  };
}

/**
 * Count unread notifications for a user.
 */
async function getUnreadCount(userId) {
  return Notification.countDocuments({ recipient: userId, isRead: false });
}

/**
 * Mark a single notification as read.
 */
async function markAsRead(notificationId, userId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true },
    { new: true }
  );
  if (notification) {
    emitToUser(userId.toString(), 'notification-read', { _id: notificationId });
  }
  return notification;
}

/**
 * Mark ALL notifications as read for a user.
 */
async function markAllAsRead(userId) {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );
  emitToUser(userId.toString(), 'all-notifications-read', {});
  return result.modifiedCount;
}

/**
 * Delete a single notification.
 */
async function deleteNotification(notificationId, userId) {
  return Notification.findOneAndDelete({ _id: notificationId, recipient: userId });
}

/**
 * Clear all notifications for a user.
 */
async function clearAll(userId) {
  const result = await Notification.deleteMany({ recipient: userId });
  return result.deletedCount;
}

module.exports = {
  setIO,
  emitToUser,
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
};

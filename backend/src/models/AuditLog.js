const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      required: true,
      enum: [
        'DELETE_POST',
        'BULK_DELETE_POSTS',
        'HARD_DELETE_POST',
        'RESTORE_POST',
        'MODERATE_POST',
        'BAN_USER',
        'SUSPEND_USER',
        'UPDATE_USER_ROLE',
        'DELETE_CATEGORY',
        'RESOLVE_REPORT',
        'DELETE_BLOG_POST',
        'BULK_DELETE_BLOG_POSTS',
        'HARD_DELETE_BLOG_POST',
        'RESTORE_BLOG_POST',
      ],
      index: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetModel: {
      type: String,
      enum: ['Post', 'BlogPost', 'User', 'Category', 'Report'],
      default: 'Post',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ targetId: 1, actionType: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

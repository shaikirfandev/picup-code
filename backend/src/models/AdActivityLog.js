const mongoose = require('mongoose');

const adActivityLogSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        'CAMPAIGN_CREATED',
        'CAMPAIGN_UPDATED',
        'CAMPAIGN_PAUSED',
        'CAMPAIGN_RESUMED',
        'CAMPAIGN_DELETED',
        'CAMPAIGN_COMPLETED',
        'BUDGET_CHANGED',
        'AD_LAUNCHED',
        'AD_PAUSED',
        'AD_UPDATED',
        'AD_GROUP_CREATED',
        'AD_GROUP_UPDATED',
        'AD_GROUP_DELETED',
        'REPORT_GENERATED',
        'REPORT_EXPORTED',
        'TEMPLATE_SAVED',
        'BUSINESS_CREATED',
        'BUSINESS_UPDATED',
        'MEMBER_ADDED',
        'MEMBER_REMOVED',
        'MEMBER_ROLE_CHANGED',
        'AD_ACCOUNT_CREATED',
        'CATALOG_CREATED',
        'CATALOG_UPDATED',
        'PRODUCT_ADDED',
        'PRODUCT_UPDATED',
        'BULK_EDIT',
      ],
    },
    entityType: {
      type: String,
      enum: ['Campaign', 'AdGroup', 'Advertisement', 'Business', 'AdAccount', 'Catalog', 'AdReportTemplate'],
      default: 'Campaign',
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

adActivityLogSchema.index({ owner: 1, createdAt: -1 });
adActivityLogSchema.index({ actionType: 1 });
adActivityLogSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('AdActivityLog', adActivityLogSchema);

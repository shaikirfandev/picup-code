const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    // User who performed the transaction
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Type of credit activity
    type: {
      type: String,
      enum: ['purchase', 'usage', 'refund', 'bonus', 'adjustment'],
      required: true,
      index: true,
    },
    // Source/reason for transaction
    source: {
      type: String,
      enum: [
        'post_promotion',
        'analytics_unlock',
        'subscription',
        'manual_purchase',
        'ai_caption',
        'feature_pin',
        'admin_grant',
        'monthly_free',
        'refund_usage',
        'other'
      ],
      required: true,
      index: true,
    },
    // Amount of credits transacted
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Status of transaction
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'reversed'],
      default: 'pending',
      index: true,
    },
    // Balance after this transaction
    balanceAfter: {
      type: Number,
      required: true,
    },
    // Balance before this transaction
    balanceBefore: {
      type: Number,
      required: true,
    },
    // Description for end user
    description: String,
    // Reference ID (payment ID, post ID, ad ID, etc)
    referenceId: String,
    referenceType: {
      type: String,
      enum: ['payment', 'post', 'ad', 'feature', 'admin', 'subscription'],
    },
    // Related payment document
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    // Metadata for flexible tracking
    metadata: mongoose.Schema.Types.Mixed,
    // IP address for audit trail
    ipAddress: String,
    // User agent for audit trail
    userAgent: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for efficient querying
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ user: 1, type: 1, createdAt: -1 });
transactionSchema.index({ user: 1, status: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ referenceId: 1 });
transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);

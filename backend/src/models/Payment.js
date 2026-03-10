const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Payment type
    type: {
      type: String,
      enum: ['ad_payment', 'subscription', 'wallet_topup', 'refund'],
      required: true,
    },
    // Amount
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['USD', 'INR'],
      required: true,
      default: 'USD',
    },
    // Payment gateway details
    gateway: {
      type: String,
      enum: ['stripe', 'razorpay', 'manual'],
      required: true,
    },
    gatewayPaymentId: String,
    gatewayOrderId: String,
    gatewaySignature: String,
    // Status
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
    },
    // Reference
    advertisement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Advertisement',
    },
    // Metadata
    description: { type: String, default: '' },
    receiptUrl: String,
    metadata: mongoose.Schema.Types.Mixed,
    // Timestamps
    paidAt: Date,
    refundedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ gatewayPaymentId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);

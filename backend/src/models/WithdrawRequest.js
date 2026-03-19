const mongoose = require('mongoose');

const withdrawRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      enum: ['USD', 'INR'],
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected'],
      default: 'pending',
    },
    payoutMethod: {
      type: String,
      enum: ['bank_transfer', 'paypal', 'upi', 'stripe'],
      default: 'bank_transfer',
    },
    payoutDetails: {
      accountName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      bankName: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      paypalEmail: { type: String, default: '' },
      upiId: { type: String, default: '' },
    },
    // Admin fields
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    processedAt: Date,
    rejectionReason: { type: String, default: '' },
    transactionRef: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

withdrawRequestSchema.index({ user: 1, createdAt: -1 });
withdrawRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('WithdrawRequest', withdrawRequestSchema);

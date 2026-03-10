const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['credit_card', 'debit_card', 'upi', 'paypal', 'bank_account'],
      required: true,
    },
    label: {
      type: String,
      default: '',
      maxlength: 100,
    },
    // Masked/safe display info only (never store raw card numbers)
    details: {
      last4: { type: String, default: '' },
      brand: { type: String, default: '' }, // visa, mastercard, etc.
      expiryMonth: { type: Number },
      expiryYear: { type: Number },
      bankName: { type: String, default: '' },
      upiId: { type: String, default: '' },
      paypalEmail: { type: String, default: '' },
    },
    // Gateway token (for charging)
    gatewayToken: { type: String, default: '' },
    gateway: {
      type: String,
      enum: ['stripe', 'razorpay', 'manual'],
      default: 'stripe',
    },
    isDefault: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

paymentMethodSchema.index({ user: 1, isDefault: -1 });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);

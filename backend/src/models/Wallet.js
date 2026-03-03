const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    // User reference - one wallet per user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    // Core balance - total available credits
    balance: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
    // Total credits purchased via payments
    totalPurchased: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Total credits used/spent
    totalUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Bonus credits from admin or promotions
    bonusCredits: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Currency type - defaults to CREDITS
    currency: {
      type: String,
      enum: ['CREDITS', 'USD', 'INR'],
      default: 'CREDITS',
    },
    // Reserved credits for pending transactions
    reservedCredits: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Monthly free credits allocation
    monthlyFreeCredits: {
      allocated: { type: Number, default: 100 },
      used: { type: Number, default: 0 },
      lastResetDate: { type: Date, default: Date.now },
    },
    // Auto-recharge feature
    autoRecharge: {
      enabled: { type: Boolean, default: false },
      threshold: { type: Number, default: 500 }, // Auto-recharge when below this amount
      amount: { type: Number, default: 1000 }, // Amount to recharge
      lastChargeDate: Date,
      failureCount: { type: Number, default: 0 },
    },
    // Preferred payment method
    preferredPaymentMethod: {
      gateway: { type: String, enum: ['stripe', 'razorpay'] },
      customerId: String,
      last4: String,
      brand: String,
      expiryMonth: Number,
      expiryYear: Number,
    },
    // Wallet freezing/suspension
    isFrozen: { type: Boolean, default: false },
    frozenReason: String,
    frozenAt: Date,
    frozenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Activity tracking
    lastCreditPurchaseAt: Date,
    lastCreditUsedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for available balance (balance - reserved)
walletSchema.virtual('availableBalance').get(function () {
  return Math.max(0, this.balance - this.reservedCredits);
});

// Indexes for performance
walletSchema.index({ user: 1, updatedAt: -1 });
walletSchema.index({ isFrozen: 1 });
walletSchema.index({ balance: 1 });

module.exports = mongoose.model('Wallet', walletSchema);

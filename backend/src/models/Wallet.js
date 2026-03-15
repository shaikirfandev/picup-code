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

// ---- Instance Methods ----

/**
 * Add credits to the wallet and record a transaction.
 * @param {Number} amount   - credits to add (must be > 0)
 * @param {String} description - human-readable reason
 * @param {String} referenceId - related payment / entity ID
 * @returns {Object} { wallet, transaction }
 */
walletSchema.methods.addCredit = async function (amount, description, referenceId) {
  if (this.isFrozen) {
    throw new Error('Wallet is frozen – credits cannot be added');
  }
  if (!amount || amount <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  const Transaction = mongoose.model('Transaction');
  const balanceBefore = this.balance;

  this.balance += amount;
  this.totalPurchased += amount;
  this.lastCreditPurchaseAt = new Date();
  await this.save();

  const transaction = await Transaction.create({
    user: this.user,
    type: 'purchase',
    source: 'wallet_topup',
    amount,
    status: 'completed',
    balanceBefore,
    balanceAfter: this.balance,
    description: description || 'Credit added',
    referenceId: referenceId || undefined,
    referenceType: 'payment',
  });

  return { wallet: this, transaction };
};

/**
 * Deduct credits from the wallet and record a transaction.
 * @param {Number} amount      - credits to deduct
 * @param {String} description - reason
 * @param {String} source      - transaction source enum value
 * @param {String} referenceId - related entity ID
 * @returns {Object} { wallet, transaction }
 */
walletSchema.methods.deductCredit = async function (amount, description, source, referenceId) {
  if (this.isFrozen) {
    throw new Error('Wallet is frozen – credits cannot be deducted');
  }
  if (!amount || amount <= 0) {
    throw new Error('Amount must be greater than zero');
  }
  if (this.availableBalance < amount) {
    throw new Error('Insufficient credits');
  }

  const Transaction = mongoose.model('Transaction');
  const balanceBefore = this.balance;

  this.balance -= amount;
  this.totalUsed += amount;
  this.lastCreditUsedAt = new Date();
  await this.save();

  const transaction = await Transaction.create({
    user: this.user,
    type: 'usage',
    source: source || 'other',
    amount,
    status: 'completed',
    balanceBefore,
    balanceAfter: this.balance,
    description: description || 'Credit deducted',
    referenceId: referenceId || undefined,
    referenceType: referenceId ? 'payment' : undefined,
  });

  return { wallet: this, transaction };
};

// ---- Indexes ----
walletSchema.index({ user: 1, updatedAt: -1 });
walletSchema.index({ isFrozen: 1 });
walletSchema.index({ balance: 1 });

module.exports = mongoose.model('Wallet', walletSchema);

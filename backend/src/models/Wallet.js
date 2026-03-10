const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['USD', 'INR'],
      default: 'USD',
    },
    totalCredits: { type: Number, default: 0 },  // lifetime added
    totalDebits: { type: Number, default: 0 },   // lifetime spent
    transactions: [{
      type: {
        type: String,
        enum: ['credit', 'debit', 'refund', 'bonus'],
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      description: {
        type: String,
        default: '',
      },
      reference: {
        type: String,  // paymentId or ad Id
        default: '',
      },
      balanceAfter: {
        type: Number,
        default: 0,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// unique: true on 'user' field already creates a unique index

// Add credit to wallet
walletSchema.methods.addCredit = function (amount, description = '', reference = '') {
  this.balance += amount;
  this.totalCredits += amount;
  this.transactions.push({
    type: 'credit',
    amount,
    description,
    reference,
    balanceAfter: this.balance,
  });
  return this.save();
};

// Debit from wallet
walletSchema.methods.debit = function (amount, description = '', reference = '') {
  if (this.balance < amount) {
    throw new Error('Insufficient balance');
  }
  this.balance -= amount;
  this.totalDebits += amount;
  this.transactions.push({
    type: 'debit',
    amount,
    description,
    reference,
    balanceAfter: this.balance,
  });
  return this.save();
};

module.exports = mongoose.model('Wallet', walletSchema);

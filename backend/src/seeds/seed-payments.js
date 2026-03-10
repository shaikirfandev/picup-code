/**
 * Seed realistic payment data for multiple users
 * Run: node src/seeds/seed-payments.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Wallet = require('../models/Wallet');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/picup';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Get some users
  const users = await User.find({}).limit(10).select('_id username displayName');
  if (users.length < 2) {
    console.log('Need at least 2 users. Run the main seed first.');
    process.exit(1);
  }

  console.log('Found', users.length, 'users');

  const paymentTypes = ['wallet_topup', 'ad_payment', 'subscription'];
  const gateways = ['stripe', 'razorpay'];
  const now = new Date();

  const payments = [];
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    // Each user gets 1–8 payments
    const count = Math.floor(Math.random() * 8) + 1;
    for (let j = 0; j < count; j++) {
      const type = paymentTypes[Math.floor(Math.random() * paymentTypes.length)];
      const amount = type === 'subscription'
        ? [9.99, 19.99, 49.99][Math.floor(Math.random() * 3)]
        : type === 'ad_payment'
        ? Math.floor(Math.random() * 200) + 10
        : Math.floor(Math.random() * 100) + 5;

      const daysAgo = Math.floor(Math.random() * 90);
      const paidAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
      const currency = Math.random() > 0.3 ? 'USD' : 'INR';

      payments.push({
        user: user._id,
        type,
        amount,
        currency,
        gateway: currency === 'INR' ? 'razorpay' : 'stripe',
        status: 'completed',
        description: type === 'wallet_topup' ? 'Wallet top-up'
          : type === 'ad_payment' ? 'Ad campaign payment'
          : 'Subscription payment',
        paidAt,
        gatewayPaymentId: 'mock_' + Math.random().toString(36).slice(2, 10),
        createdAt: paidAt,
      });
    }
  }

  // Clear existing test payments (keep the admin one)
  await Payment.deleteMany({ gatewayPaymentId: { $regex: /^mock_/ } });
  const result = await Payment.insertMany(payments);
  console.log('Inserted', result.length, 'payments');

  // Create/update wallets for users with wallet_topup payments
  for (const user of users) {
    const userPayments = payments.filter(
      (p) => p.user.toString() === user._id.toString() && p.type === 'wallet_topup'
    );
    if (userPayments.length > 0) {
      let wallet = await Wallet.findOne({ user: user._id });
      if (!wallet) {
        wallet = new Wallet({ user: user._id, currency: 'USD' });
      }
      for (const p of userPayments) {
        wallet.balance += p.amount;
        wallet.totalCredits += p.amount;
        wallet.transactions.push({
          type: 'credit',
          amount: p.amount,
          description: 'Wallet top-up',
          reference: 'seed',
          balanceAfter: wallet.balance,
          createdAt: p.paidAt,
        });
      }
      // Simulate some debits
      const debitAmount = Math.min(wallet.balance * 0.3, wallet.balance);
      if (debitAmount > 0) {
        wallet.balance -= debitAmount;
        wallet.totalDebits += debitAmount;
        wallet.transactions.push({
          type: 'debit',
          amount: debitAmount,
          description: 'Ad spend',
          reference: 'seed',
          balanceAfter: wallet.balance,
          createdAt: new Date(),
        });
      }
      await wallet.save();
      console.log('  Wallet for @' + user.username + ': $' + wallet.balance.toFixed(2));
    }
  }

  console.log('\nDone! Seeded payments for', users.length, 'users');
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });

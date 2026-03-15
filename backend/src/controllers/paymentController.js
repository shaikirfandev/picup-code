const Payment = require('../models/Payment');
const Wallet = require('../models/Wallet');
const Advertisement = require('../models/Advertisement');
const User = require('../models/User');
const PaymentService = require('../services/paymentService');
const WalletService = require('../services/walletService');
const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');
const crypto = require('crypto');
const apiResponse = require('../utils/apiResponse');

// Create payment intent (for ad posting)
exports.createPayment = async (req, res, next) => {
  try {
    const { amount, currency = 'USD', type = 'ad_payment', advertisementId, description } = req.body;

    if (!['USD', 'INR'].includes(currency)) {
      return ApiResponse.error(res, 'Only USD and INR currencies are supported', 400);
    }

    if (amount <= 0) {
      return ApiResponse.error(res, 'Amount must be greater than 0', 400);
    }

    const payment = await Payment.create({
      user: req.user._id,
      type,
      amount,
      currency,
      gateway: currency === 'INR' ? 'razorpay' : 'stripe',
      advertisement: advertisementId || undefined,
      description: description || `Payment for ${type}`,
      status: 'pending',
    });

    // In production, this would create a Stripe/Razorpay order
    // For now, we return a mock payment intent
    const paymentData = {
      paymentId: payment._id,
      amount,
      currency,
      gateway: payment.gateway,
      // These would be real gateway details in production
      clientSecret: `mock_secret_${payment._id}`,
      orderId: `order_${payment._id}`,
    };

    ApiResponse.created(res, paymentData, 'Payment intent created');
  } catch (error) {
    next(error);
  }
};

// Confirm payment (webhook or client confirmation)
exports.confirmPayment = async (req, res, next) => {
  try {
    const { paymentId, gatewayPaymentId, gatewaySignature } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) return ApiResponse.notFound(res, 'Payment not found');

    if (payment.user.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'Not authorized');
    }

    // In production: verify signature with Stripe/Razorpay
    payment.status = 'completed';
    payment.gatewayPaymentId = gatewayPaymentId || `mock_${Date.now()}`;
    payment.gatewaySignature = gatewaySignature || `sig_${Date.now()}`;
    payment.paidAt = new Date();
    await payment.save();

    // If ad payment, activate the ad
    if (payment.advertisement) {
      await Advertisement.findByIdAndUpdate(payment.advertisement, {
        isPaid: true,
        status: 'active',
        paymentId: payment._id,
      });
    }

    // Add credits to wallet
    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id, currency: payment.currency });
    }
    // For wallet topup, add to balance
    if (payment.type === 'wallet_topup') {
      await wallet.addCredit(payment.amount, 'Wallet top-up', payment._id.toString());
    }

    ApiResponse.success(res, payment, 'Payment confirmed');
  } catch (error) {
    next(error);
  }
};

// Get my payments
exports.getMyPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type, status } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = { user: req.user._id };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('advertisement', 'title status')
        .lean(),
      Payment.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, payments, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// Get wallet
exports.getWallet = async (req, res, next) => {
  try {
    const Transaction = require('../models/Transaction');

    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id });
    }

    // Fetch last 20 transactions from Transaction collection
    const recentTransactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Map transactions to the shape the frontend expects
    const mappedTransactions = recentTransactions.map((tx) => ({
      type: ['purchase', 'bonus', 'refund'].includes(tx.type) ? 'credit' : 'debit',
      amount: tx.amount,
      description: tx.description || tx.source,
      balanceAfter: tx.balanceAfter,
      createdAt: tx.createdAt,
      status: tx.status,
      source: tx.source,
    }));

    ApiResponse.success(res, {
      balance: wallet.balance,
      currency: wallet.currency,
      totalCredits: wallet.totalPurchased + (wallet.bonusCredits || 0),
      totalDebits: wallet.totalUsed,
      transactions: mappedTransactions,
    });
  } catch (error) {
    next(error);
  }
};

// Top up wallet
exports.topUpWallet = async (req, res, next) => {
  try {
    const { amount, currency = 'USD' } = req.body;

    if (!['USD', 'INR'].includes(currency)) {
      return ApiResponse.error(res, 'Only USD and INR currencies are supported', 400);
    }

    if (!amount || amount < 1) {
      return ApiResponse.error(res, 'Minimum top-up amount is 1', 400);
    }

    // Create a completed payment for wallet top-up (mock gateway auto-confirms)
    const payment = await Payment.create({
      user: req.user._id,
      type: 'wallet_topup',
      amount,
      currency,
      gateway: currency === 'INR' ? 'razorpay' : 'stripe',
      description: `Wallet top-up: ${amount} ${currency}`,
      status: 'completed',
      gatewayPaymentId: `mock_${Date.now()}`,
      gatewaySignature: `sig_${Date.now()}`,
      paidAt: new Date(),
    });

    // Add credits to wallet
    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id, currency });
    }
    const result = await wallet.addCredit(amount, 'Wallet top-up', payment._id.toString());

    ApiResponse.created(res, {
      paymentId: payment._id,
      amount,
      currency,
      gateway: payment.gateway,
      newBalance: result.wallet.balance,
    }, 'Wallet topped up successfully');
  } catch (error) {
    next(error);
  }
};

// Admin: Get all payments
exports.getAllPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'username email displayName')
        .populate('advertisement', 'title')
        .lean(),
      Payment.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, payments, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

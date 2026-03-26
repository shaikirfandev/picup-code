const Payment = require('../models/Payment');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const PaymentMethod = require('../models/PaymentMethod');
const WithdrawRequest = require('../models/WithdrawRequest');
const PaymentService = require('../services/paymentService');
const WalletService = require('../services/walletService');
const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');
const crypto = require('crypto');
const apiResponse = require('../utils/apiResponse');

// Create payment intent
exports.createPayment = async (req, res, next) => {
  try {
    const { amount, currency = 'USD', type = 'wallet_topup', description } = req.body;

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
      totalCredits: wallet.totalCredits || wallet.totalPurchased || 0,
      totalDebits: wallet.totalDebits || wallet.totalUsed || 0,
      transactions: mappedTransactions,
    });
  } catch (error) {
    next(error);
  }
};

// Get wallet transactions (paginated)
exports.getWalletTransactions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id });
    }

    const allTransactions = [...(wallet.transactions || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const items = allTransactions.slice(skip, skip + limit);

    ApiResponse.paginated(
      res,
      items,
      getPaginationMeta(allTransactions.length, page, limit),
      'Wallet transactions'
    );
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
      newBalance: result.balance,
    }, 'Wallet topped up successfully');
  } catch (error) {
    next(error);
  }
};

// Request withdrawal
exports.requestWithdraw = async (req, res, next) => {
  try {
    const { amount, currency, payoutMethod = 'bank_transfer', payoutDetails = {}, notes = '' } = req.body;
    const requestedAmount = Number(amount);

    if (!requestedAmount || requestedAmount < 1) {
      return ApiResponse.error(res, 'Minimum withdrawal amount is 1', 400);
    }

    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id });
    }

    if (wallet.balance < requestedAmount) {
      return ApiResponse.error(res, 'Insufficient wallet balance', 400);
    }

    const withdrawRequest = await WithdrawRequest.create({
      user: req.user._id,
      amount: requestedAmount,
      currency: currency || wallet.currency || 'USD',
      payoutMethod,
      payoutDetails,
      notes,
      status: 'pending',
    });

    await wallet.debit(requestedAmount, 'Withdrawal request', withdrawRequest._id.toString());

    ApiResponse.created(
      res,
      { request: withdrawRequest, balance: wallet.balance },
      'Withdrawal request submitted'
    );
  } catch (error) {
    next(error);
  }
};

// Get my withdrawal requests
exports.getMyWithdrawals = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const { skip } = paginate(null, page, limit);
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const [rows, total] = await Promise.all([
      WithdrawRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      WithdrawRequest.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, rows, getPaginationMeta(total, page, limit), 'My withdrawals');
  } catch (error) {
    next(error);
  }
};

// Payment methods
exports.getPaymentMethods = async (req, res, next) => {
  try {
    const methods = await PaymentMethod.find({ user: req.user._id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();
    ApiResponse.success(res, methods, 'Payment methods');
  } catch (error) {
    next(error);
  }
};

exports.addPaymentMethod = async (req, res, next) => {
  try {
    const { type, label = '', details = {}, gateway = 'stripe', gatewayToken = '', isDefault = false } = req.body;

    if (!type) {
      return ApiResponse.error(res, 'Payment method type is required', 400);
    }

    if (isDefault) {
      await PaymentMethod.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
    }

    const method = await PaymentMethod.create({
      user: req.user._id,
      type,
      label,
      details,
      gateway,
      gatewayToken,
      isDefault: Boolean(isDefault),
    });

    ApiResponse.created(res, method, 'Payment method added');
  } catch (error) {
    next(error);
  }
};

exports.updatePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    const method = await PaymentMethod.findOne({ _id: id, user: req.user._id });
    if (!method) {
      return ApiResponse.notFound(res, 'Payment method not found');
    }

    if (updates.isDefault === true) {
      await PaymentMethod.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
      method.isDefault = true;
    }

    if (typeof updates.type === 'string') method.type = updates.type;
    if (typeof updates.label === 'string') method.label = updates.label;
    if (typeof updates.gateway === 'string') method.gateway = updates.gateway;
    if (typeof updates.gatewayToken === 'string') method.gatewayToken = updates.gatewayToken;
    if (updates.details && typeof updates.details === 'object') method.details = updates.details;
    if (typeof updates.isVerified === 'boolean') method.isVerified = updates.isVerified;

    await method.save();
    ApiResponse.success(res, method, 'Payment method updated');
  } catch (error) {
    next(error);
  }
};

exports.deletePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await PaymentMethod.findOneAndDelete({ _id: id, user: req.user._id });
    if (!deleted) {
      return ApiResponse.notFound(res, 'Payment method not found');
    }
    ApiResponse.success(res, null, 'Payment method deleted');
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
        .lean(),
      Payment.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, payments, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// Subscribe to a plan
const PLAN_PRICES = {
  basic: { amount: 4.99, label: 'Basic' },
  pro: { amount: 9.99, label: 'Pro' },
  enterprise: { amount: 29.99, label: 'Enterprise' },
};

exports.subscribe = async (req, res, next) => {
  try {
    const { plan, currency = 'USD' } = req.body;

    if (!['basic', 'pro', 'enterprise'].includes(plan)) {
      return ApiResponse.error(res, 'Invalid plan. Choose basic, pro, or enterprise.', 400);
    }

    const planInfo = PLAN_PRICES[plan];

    // Create subscription payment record
    const payment = await Payment.create({
      user: req.user._id,
      type: 'subscription',
      amount: planInfo.amount,
      currency,
      gateway: currency === 'INR' ? 'razorpay' : 'stripe',
      description: `${planInfo.label} plan subscription`,
      status: 'completed',
      gatewayPaymentId: `sub_${Date.now()}`,
      gatewaySignature: `sig_${Date.now()}`,
      paidAt: new Date(),
    });

    // Upgrade user
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        accountType: 'paid',
        subscription: {
          plan,
          startDate: now,
          endDate,
          isActive: true,
        },
      },
      { new: true }
    ).select('-password -refreshToken');

    ApiResponse.success(res, {
      user,
      payment: {
        id: payment._id,
        amount: planInfo.amount,
        currency,
        plan,
      },
    }, `Successfully subscribed to ${planInfo.label} plan!`);
  } catch (error) {
    next(error);
  }
};

// Backward-compatible alias used by routes
exports.subscribePlan = (req, res, next) => exports.subscribe(req, res, next);

// Get my subscription
exports.getSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('accountType subscription').lean();
    ApiResponse.success(res, {
      accountType: user.accountType,
      subscription: user.subscription || { plan: 'none', isActive: false },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: list withdrawal requests
exports.adminGetWithdrawals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const { skip } = paginate(null, page, limit);
    const filter = {};
    if (status) filter.status = status;

    const [rows, total] = await Promise.all([
      WithdrawRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'username email displayName')
        .populate('processedBy', 'username email displayName')
        .lean(),
      WithdrawRequest.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, rows, getPaginationMeta(total, page, limit), 'Withdrawals');
  } catch (error) {
    next(error);
  }
};

// Admin: process withdrawal request
exports.adminProcessWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason = '', transactionRef = '', notes = '' } = req.body;
    const allowed = ['processing', 'completed', 'rejected'];

    if (!allowed.includes(status)) {
      return ApiResponse.error(res, 'Invalid status. Use processing, completed, or rejected.', 400);
    }

    const request = await WithdrawRequest.findById(id);
    if (!request) {
      return ApiResponse.notFound(res, 'Withdrawal request not found');
    }

    const prevStatus = request.status;
    request.status = status;
    request.rejectionReason = rejectionReason;
    request.transactionRef = transactionRef;
    request.notes = notes;
    request.processedBy = req.user._id;
    request.processedAt = new Date();
    await request.save();

    // If rejected after amount was reserved, return credits once.
    if (status === 'rejected' && ['pending', 'processing'].includes(prevStatus)) {
      let wallet = await Wallet.findOne({ user: request.user });
      if (!wallet) {
        wallet = await Wallet.create({ user: request.user, currency: request.currency || 'USD' });
      }
      await wallet.addCredit(request.amount, 'Withdrawal rejection refund', request._id.toString());
    }

    ApiResponse.success(res, request, 'Withdrawal request updated');
  } catch (error) {
    next(error);
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.accountType !== 'paid' || !user.subscription?.isActive) {
      return ApiResponse.error(res, 'No active subscription to cancel', 400);
    }

    // Keep access until the end date, just mark as not renewing
    user.subscription.isActive = false;
    await user.save();

    ApiResponse.success(res, {
      accountType: user.accountType,
      subscription: user.subscription,
    }, 'Subscription cancelled. You\'ll retain access until the current period ends.');
  } catch (error) {
    next(error);
  }
};

const Payment = require('../models/Payment');
const Wallet = require('../models/Wallet');
const Advertisement = require('../models/Advertisement');
const WithdrawRequest = require('../models/WithdrawRequest');
const PaymentMethod = require('../models/PaymentMethod');
const User = require('../models/User');
const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');

// ──────────────────────────────────────────────
// PAYMENT CRUD
// ──────────────────────────────────────────────

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

    const paymentData = {
      paymentId: payment._id,
      amount,
      currency,
      gateway: payment.gateway,
      clientSecret: `mock_secret_${payment._id}`,
      orderId: `order_${payment._id}`,
    };

    ApiResponse.created(res, paymentData, 'Payment intent created');
  } catch (error) {
    next(error);
  }
};

exports.confirmPayment = async (req, res, next) => {
  try {
    const { paymentId, gatewayPaymentId, gatewaySignature } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) return ApiResponse.notFound(res, 'Payment not found');

    if (payment.user.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'Not authorized');
    }

    payment.status = 'completed';
    payment.gatewayPaymentId = gatewayPaymentId || `mock_${Date.now()}`;
    payment.gatewaySignature = gatewaySignature || `sig_${Date.now()}`;
    payment.paidAt = new Date();
    await payment.save();

    if (payment.advertisement) {
      await Advertisement.findByIdAndUpdate(payment.advertisement, {
        isPaid: true,
        status: 'active',
        paymentId: payment._id,
      });
    }

    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id, currency: payment.currency });
    }
    if (payment.type === 'wallet_topup') {
      await wallet.addCredit(payment.amount, 'Wallet top-up', payment._id.toString());
    }

    ApiResponse.success(res, payment, 'Payment confirmed');
  } catch (error) {
    next(error);
  }
};

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

// ──────────────────────────────────────────────
// WALLET
// ──────────────────────────────────────────────

exports.getWallet = async (req, res, next) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id });
    }

    const recentTransactions = wallet.transactions
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20);

    ApiResponse.success(res, {
      balance: wallet.balance,
      currency: wallet.currency,
      totalCredits: wallet.totalCredits,
      totalDebits: wallet.totalDebits,
      transactions: recentTransactions,
    });
  } catch (error) {
    next(error);
  }
};

exports.getWalletTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id });
    }

    let txns = [...wallet.transactions].sort((a, b) => b.createdAt - a.createdAt);
    if (type) txns = txns.filter((t) => t.type === type);

    const total = txns.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginated = txns.slice(start, start + parseInt(limit));

    ApiResponse.paginated(res, paginated, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.topUpWallet = async (req, res, next) => {
  try {
    const { amount, currency = 'USD' } = req.body;

    if (!['USD', 'INR'].includes(currency)) {
      return ApiResponse.error(res, 'Only USD and INR currencies are supported', 400);
    }
    if (!amount || amount < 1) {
      return ApiResponse.error(res, 'Minimum top-up amount is 1', 400);
    }

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

    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id, currency });
    }
    await wallet.addCredit(amount, 'Wallet top-up', payment._id.toString());

    ApiResponse.created(res, {
      paymentId: payment._id,
      amount,
      currency,
      gateway: payment.gateway,
      newBalance: wallet.balance,
    }, 'Wallet topped up successfully');
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// WITHDRAW
// ──────────────────────────────────────────────

exports.requestWithdraw = async (req, res, next) => {
  try {
    const { amount, currency = 'USD', payoutMethod = 'bank_transfer', payoutDetails = {} } = req.body;

    if (!amount || amount < 5) {
      return ApiResponse.error(res, 'Minimum withdrawal is $5 / ₹500', 400);
    }

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < amount) {
      return ApiResponse.error(res, 'Insufficient balance', 400);
    }

    // Check pending withdrawals
    const pendingCount = await WithdrawRequest.countDocuments({ user: req.user._id, status: 'pending' });
    if (pendingCount >= 3) {
      return ApiResponse.error(res, 'Maximum 3 pending withdrawal requests allowed', 400);
    }

    // Debit immediately (hold)
    await wallet.debit(amount, 'Withdrawal request (held)', '');

    const request = await WithdrawRequest.create({
      user: req.user._id,
      amount,
      currency,
      payoutMethod,
      payoutDetails,
    });

    ApiResponse.created(res, request, 'Withdrawal request submitted');
  } catch (error) {
    next(error);
  }
};

exports.getMyWithdrawals = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const [requests, total] = await Promise.all([
      WithdrawRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      WithdrawRequest.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, requests, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PAYMENT METHODS
// ──────────────────────────────────────────────

exports.getPaymentMethods = async (req, res, next) => {
  try {
    const methods = await PaymentMethod.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 }).lean();
    ApiResponse.success(res, methods);
  } catch (error) {
    next(error);
  }
};

exports.addPaymentMethod = async (req, res, next) => {
  try {
    const { type, label, details, gateway = 'stripe' } = req.body;

    if (!type) return ApiResponse.error(res, 'Payment method type required', 400);

    // If first method, make it default
    const existing = await PaymentMethod.countDocuments({ user: req.user._id });

    const method = await PaymentMethod.create({
      user: req.user._id,
      type,
      label: label || `${type} ending ${details?.last4 || '****'}`,
      details: details || {},
      gateway,
      isDefault: existing === 0,
      isVerified: true, // Auto-verify in mock
    });

    ApiResponse.created(res, method, 'Payment method added');
  } catch (error) {
    next(error);
  }
};

exports.updatePaymentMethod = async (req, res, next) => {
  try {
    const method = await PaymentMethod.findOne({ _id: req.params.id, user: req.user._id });
    if (!method) return ApiResponse.notFound(res, 'Payment method not found');

    const { label, details, isDefault } = req.body;
    if (label) method.label = label;
    if (details) method.details = { ...method.details, ...details };

    if (isDefault) {
      await PaymentMethod.updateMany({ user: req.user._id }, { isDefault: false });
      method.isDefault = true;
    }

    await method.save();
    ApiResponse.success(res, method, 'Payment method updated');
  } catch (error) {
    next(error);
  }
};

exports.deletePaymentMethod = async (req, res, next) => {
  try {
    const method = await PaymentMethod.findOne({ _id: req.params.id, user: req.user._id });
    if (!method) return ApiResponse.notFound(res, 'Payment method not found');

    await method.deleteOne();

    // If it was default, set first remaining as default
    if (method.isDefault) {
      const first = await PaymentMethod.findOne({ user: req.user._id }).sort({ createdAt: 1 });
      if (first) {
        first.isDefault = true;
        await first.save();
      }
    }

    ApiResponse.success(res, null, 'Payment method removed');
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// SUBSCRIPTION
// ──────────────────────────────────────────────

exports.subscribePlan = async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!['basic', 'pro', 'enterprise'].includes(plan)) {
      return ApiResponse.error(res, 'Invalid plan', 400);
    }

    const planPrices = { basic: 9.99, pro: 29.99, enterprise: 99.99 };
    const price = planPrices[plan];

    // Check wallet balance
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < price) {
      return ApiResponse.error(res, `Insufficient balance. Need $${price}`, 400);
    }

    // Debit wallet
    await wallet.debit(price, `${plan} plan subscription`, req.user._id.toString());

    // Create payment record
    await Payment.create({
      user: req.user._id,
      type: 'subscription',
      amount: price,
      currency: 'USD',
      gateway: 'manual',
      description: `${plan} plan subscription`,
      status: 'completed',
      paidAt: new Date(),
    });

    // Update user
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    await User.findByIdAndUpdate(req.user._id, {
      accountType: 'paid',
      'subscription.plan': plan,
      'subscription.startDate': new Date(),
      'subscription.endDate': endDate,
      'subscription.isActive': true,
    });

    ApiResponse.success(res, { plan, expiresAt: endDate, price }, `Subscribed to ${plan} plan`);
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// ADMIN
// ──────────────────────────────────────────────

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

exports.adminGetWithdrawals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = {};
    if (status) filter.status = status;

    const [requests, total] = await Promise.all([
      WithdrawRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'username email displayName avatar')
        .lean(),
      WithdrawRequest.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, requests, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.adminProcessWithdrawal = async (req, res, next) => {
  try {
    const { action, rejectionReason } = req.body;
    const request = await WithdrawRequest.findById(req.params.id);
    if (!request) return ApiResponse.notFound(res, 'Withdrawal request not found');

    if (request.status !== 'pending') {
      return ApiResponse.error(res, 'Request already processed', 400);
    }

    if (action === 'approve') {
      request.status = 'completed';
      request.processedBy = req.user._id;
      request.processedAt = new Date();
    } else if (action === 'reject') {
      request.status = 'rejected';
      request.processedBy = req.user._id;
      request.processedAt = new Date();
      request.rejectionReason = rejectionReason || '';

      // Refund the held amount
      const wallet = await Wallet.findOne({ user: request.user });
      if (wallet) {
        await wallet.addCredit(request.amount, 'Withdrawal rejected — refund', request._id.toString());
      }
    } else {
      return ApiResponse.error(res, 'Invalid action. Use approve or reject.', 400);
    }

    await request.save();
    ApiResponse.success(res, request, `Withdrawal ${action}d`);
  } catch (error) {
    next(error);
  }
};

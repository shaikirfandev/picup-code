const crypto = require('crypto');
const Payment = require('../models/Payment');
const Wallet = require('../models/Wallet');
const WalletService = require('./walletService');

class PaymentService {
  /**
   * Create Razorpay order for credit purchase
   */
  static async createRazorpayOrder(userId, amount, currency = 'INR') {
    try {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay credentials not configured');
      }

      // Import Razorpay SDK
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      // Create order
      const options = {
        amount: Math.round(amount * 100), // Convert to paise
        currency,
        receipt: `receipt_${userId}_${Date.now()}`,
        notes: {
          userId,
          type: 'wallet_topup',
        },
      };

      const order = await razorpay.orders.create(options);

      // Save payment record
      const payment = new Payment({
        user: userId,
        type: 'wallet_topup',
        amount,
        currency,
        gateway: 'razorpay',
        gatewayOrderId: order.id,
        status: 'pending',
        metadata: {
          orderId: order.id,
        },
      });

      await payment.save();

      return {
        success: true,
        orderId: order.id,
        paymentId: payment._id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      };
    } catch (error) {
      throw new Error(`Error creating Razorpay order: ${error.message}`);
    }
  }

  /**
   * Verify Razorpay payment
   */
  static async verifyRazorpayPayment(paymentId, orderId, signature) {
    try {
      // Verify signature
      const body = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        throw new Error('Invalid payment signature');
      }

      // Find and update payment
      const payment = await Payment.findOne({
        gatewayOrderId: orderId,
        gateway: 'razorpay',
      });

      if (!payment) {
        throw new Error('Payment record not found');
      }

      payment.status = 'completed';
      payment.gatewayPaymentId = paymentId;
      payment.gatewaySignature = signature;
      payment.paidAt = new Date();
      payment.metadata.verified = true;
      await payment.save();

      // Add credits to wallet
      const creditsAmount = Math.floor(payment.amount); // 1 INR/USD = 1 credit simplified
      await WalletService.addCredits(
        payment.user,
        creditsAmount,
        'manual_purchase',
        'purchase',
        {
          paymentId: payment._id,
          gateway: 'razorpay',
          originalAmount: payment.amount,
        }
      );

      return {
        success: true,
        payment,
        creditsAdded: creditsAmount,
      };
    } catch (error) {
      throw new Error(`Error verifying Razorpay payment: ${error.message}`);
    }
  }

  /**
   * Create Stripe PaymentIntent
   */
  static async createStripePaymentIntent(userId, amount, currency = 'usd') {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Stripe credentials not configured');
      }

      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: userId.toString(),
          type: 'wallet_topup',
        },
      });

      // Save payment record
      const payment = new Payment({
        user: userId,
        type: 'wallet_topup',
        amount,
        currency: currency.toUpperCase(),
        gateway: 'stripe',
        gatewayPaymentId: paymentIntent.id,
        status: 'processing',
        metadata: {
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
        },
      });

      await payment.save();

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentId: payment._id,
        paymentIntentId: paymentIntent.id,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      };
    } catch (error) {
      throw new Error(`Error creating Stripe PaymentIntent: ${error.message}`);
    }
  }

  /**
   * Verify Stripe PaymentIntent (webhook)
   */
  static async verifyStripePaymentIntent(paymentIntentId) {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Payment intent not succeeded');
      }

      // Find and update payment
      const payment = await Payment.findOne({
        gatewayPaymentId: paymentIntentId,
        gateway: 'stripe',
      });

      if (!payment) {
        throw new Error('Payment record not found');
      }

      payment.status = 'completed';
      payment.paidAt = new Date();
      payment.metadata.verified = true;
      payment.metadata.chargeId = paymentIntent.latest_charge;
      await payment.save();

      // Add credits to wallet
      const creditsAmount = Math.floor(payment.amount);
      await WalletService.addCredits(
        payment.user,
        creditsAmount,
        'manual_purchase',
        'purchase',
        {
          paymentId: payment._id,
          gateway: 'stripe',
          originalAmount: payment.amount,
        }
      );

      return {
        success: true,
        payment,
        creditsAdded: creditsAmount,
      };
    } catch (error) {
      throw new Error(`Error verifying Stripe payment: ${error.message}`);
    }
  }

  /**
   * Process auto-recharge
   */
  static async processAutoRecharge(userId) {
    try {
      const wallet = await Wallet.findOne({ user: userId });

      if (!wallet || !wallet.autoRecharge.enabled) {
        return { processed: false, reason: 'Auto-recharge not enabled' };
      }

      if (wallet.balance >= wallet.autoRecharge.threshold) {
        return { processed: false, reason: 'Balance above threshold' };
      }

      // Create payment for auto-recharge
      const payment = new Payment({
        user: userId,
        type: 'wallet_topup',
        amount: wallet.autoRecharge.amount,
        currency: wallet.currency,
        gateway: 'razorpay', // Default to Razorpay, could be configurable
        status: 'pending',
        description: 'Auto-recharge',
        metadata: {
          autoRecharge: true,
          previousBalance: wallet.balance,
        },
      });

      await payment.save();

      // In production, call actual payment provider API here
      // For now, mark as processing
      return {
        processed: true,
        paymentId: payment._id,
        amount: wallet.autoRecharge.amount,
      };
    } catch (error) {
      throw new Error(`Error processing auto-recharge: ${error.message}`);
    }
  }

  /**
   * Get payment history for user
   */
  static async getPaymentHistory(userId, limit = 20, page = 1) {
    try {
      const skip = (page - 1) * limit;

      const payments = await Payment
        .find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Payment.countDocuments({ user: userId });

      return {
        payments,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Error fetching payment history: ${error.message}`);
    }
  }

  /**
   * Refund payment
   */
  static async refundPayment(paymentId, reason) {
    try {
      const payment = await Payment.findById(paymentId);

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'completed') {
        throw new Error('Only completed payments can be refunded');
      }

      // Refund via payment provider
      if (payment.gateway === 'razorpay') {
        // Call Razorpay refund API
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        await razorpay.payments.refund(payment.gatewayPaymentId, {
          amount: Math.round(payment.amount * 100),
        });
      } else if (payment.gateway === 'stripe') {
        // Call Stripe refund API
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        await stripe.refunds.create({
          charge: payment.metadata.chargeId,
        });
      }

      // Update payment status
      payment.status = 'refunded';
      payment.refundedAt = new Date();
      payment.metadata.refundReason = reason;
      await payment.save();

      // Refund credits
      await WalletService.refundCredits(
        payment.user,
        Math.floor(payment.amount),
        `Refund for failed payment: ${reason}`,
        paymentId
      );

      return {
        success: true,
        payment,
      };
    } catch (error) {
      throw new Error(`Error refunding payment: ${error.message}`);
    }
  }

  /**
   * Get payment by ID
   */
  static async getPaymentById(paymentId) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }
      return payment;
    } catch (error) {
      throw new Error(`Error fetching payment: ${error.message}`);
    }
  }

  /**
   * Get revenue analytics
   */
  static async getRevenueAnalytics(startDate, endDate) {
    try {
      const stats = await Payment.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        },
        {
          $group: {
            _id: '$currency',
            totalRevenue: { $sum: '$amount' },
            transactionCount: { $sum: 1 },
            avgTransaction: { $avg: '$amount' },
          },
        },
      ]);

      return stats;
    } catch (error) {
      throw new Error(`Error fetching revenue analytics: ${error.message}`);
    }
  }
}

module.exports = PaymentService;

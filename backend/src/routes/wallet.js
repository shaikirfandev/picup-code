const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const { validateWalletTopup, validateDeductCredits } = require('../middleware/validate');

// user endpoints
router.get('/', authenticate, walletController.getWallet);
router.get('/balance', authenticate, walletController.getBalance);
router.get('/transactions', authenticate, walletController.getTransactions);
router.get('/transactions/analytics', authenticate, walletController.getTransactionAnalytics);
router.get('/transactions/export', authenticate, walletController.exportTransactions);
router.post('/deduct', authenticate, validateDeductCredits, walletController.deductCredits);
router.post('/credits', authenticate, validateWalletTopup, walletController.addCredits);
router.post('/check-balance', authenticate, walletController.checkBalance);
router.get('/rules', authenticate, walletController.getCreditRules);
router.get('/stats', authenticate, walletController.getWalletStats);
router.post('/auto-recharge', authenticate, walletController.setupAutoRecharge);

// payment flows (Razorpay/Stripe — enabled when controllers are implemented)
if (paymentController.createRazorpayOrder) {
  router.post('/razorpay/order', authenticate, paymentController.createRazorpayOrder);
  router.post('/razorpay/verify', authenticate, paymentController.verifyRazorpayPayment);
  router.post('/razorpay/webhook', paymentController.razorpayWebhook);
}
if (paymentController.createStripePaymentIntent) {
  router.post('/stripe/intent', authenticate, paymentController.createStripePaymentIntent);
  router.post('/stripe/verify', authenticate, paymentController.verifyStripePayment);
  router.post('/stripe/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);
}

// user payment history
if (paymentController.getPaymentHistory) {
  router.get('/payments', authenticate, paymentController.getPaymentHistory);
}

// admin routes
if (paymentController.refundPayment) {
  router.post('/payments/:paymentId/refund', authenticate, isAdmin, paymentController.refundPayment);
}

module.exports = router;
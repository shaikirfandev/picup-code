const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const paymentController = require('../controllers/paymentController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const { validateWalletTopup, validateDeductCredits } = require('../middleware/validate');

// user endpoints
router.get('/', ensureAuthenticated, walletController.getWallet);
router.get('/balance', ensureAuthenticated, walletController.getBalance);
router.get('/transactions', ensureAuthenticated, walletController.getTransactions);
router.get('/transactions/analytics', ensureAuthenticated, walletController.getTransactionAnalytics);
router.get('/transactions/export', ensureAuthenticated, walletController.exportTransactions);
router.post('/deduct', ensureAuthenticated, validateDeductCredits, walletController.deductCredits);
router.post('/credits', ensureAuthenticated, validateWalletTopup, walletController.addCredits);
router.post('/check-balance', ensureAuthenticated, walletController.checkBalance);
router.get('/rules', ensureAuthenticated, walletController.getCreditRules);
router.get('/stats', ensureAuthenticated, walletController.getWalletStats);
router.post('/auto-recharge', ensureAuthenticated, walletController.setupAutoRecharge);

// payment flows
router.post('/razorpay/order', ensureAuthenticated, paymentController.createRazorpayOrder);
router.post('/razorpay/verify', ensureAuthenticated, paymentController.verifyRazorpayPayment);
router.post('/razorpay/webhook', paymentController.razorpayWebhook); // public

router.post('/stripe/intent', ensureAuthenticated, paymentController.createStripePaymentIntent);
router.post('/stripe/verify', ensureAuthenticated, paymentController.verifyStripePayment);
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

// user payment history
router.get('/payments', ensureAuthenticated, paymentController.getPaymentHistory);

// admin routes
router.post('/payments/:paymentId/refund', ensureAuthenticated, ensureAdmin, paymentController.refundPayment);

module.exports = router;
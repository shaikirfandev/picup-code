const router = require('express').Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

// Authenticated routes
router.post('/create', authenticate, paymentController.createPayment);
router.post('/confirm', authenticate, paymentController.confirmPayment);
router.get('/my', authenticate, paymentController.getMyPayments);

// Wallet
router.get('/wallet', authenticate, paymentController.getWallet);
router.get('/wallet/transactions', authenticate, paymentController.getWalletTransactions);
router.post('/wallet/topup', authenticate, paymentController.topUpWallet);

// Withdraw
router.post('/withdraw', authenticate, paymentController.requestWithdraw);
router.get('/withdraw/my', authenticate, paymentController.getMyWithdrawals);

// Payment methods
router.get('/methods', authenticate, paymentController.getPaymentMethods);
router.post('/methods', authenticate, paymentController.addPaymentMethod);
router.put('/methods/:id', authenticate, paymentController.updatePaymentMethod);
router.delete('/methods/:id', authenticate, paymentController.deletePaymentMethod);

// Subscription
router.post('/subscribe', authenticate, paymentController.subscribePlan);

// Subscription
router.post('/subscribe', authenticate, paymentController.subscribe);
router.get('/subscription', authenticate, paymentController.getSubscription);
router.post('/subscription/cancel', authenticate, paymentController.cancelSubscription);

// Admin
router.get('/admin/all', authenticate, isAdmin, paymentController.getAllPayments);
router.get('/admin/withdrawals', authenticate, isAdmin, paymentController.adminGetWithdrawals);
router.put('/admin/withdrawals/:id', authenticate, isAdmin, paymentController.adminProcessWithdrawal);

module.exports = router;

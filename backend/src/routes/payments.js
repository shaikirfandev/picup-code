const router = require('express').Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const { validatePaymentCreate, validateWalletTopup } = require('../middleware/validate');

// Authenticated routes
router.post('/create', authenticate, validatePaymentCreate, paymentController.createPayment);
router.post('/confirm', authenticate, paymentController.confirmPayment);
router.get('/my', authenticate, paymentController.getMyPayments);

// Wallet
router.get('/wallet', authenticate, paymentController.getWallet);
router.post('/wallet/topup', authenticate, validateWalletTopup, paymentController.topUpWallet);

// Admin
router.get('/admin/all', authenticate, isAdmin, paymentController.getAllPayments);

module.exports = router;

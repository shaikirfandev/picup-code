const router = require('express').Router();
const adminWalletController = require('../controllers/adminWalletController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

// All routes require admin authentication
router.use(authenticate, isAdmin);

// ── Wallet Recharges ────────────────────────────────────────────
router.get('/recharges', adminWalletController.getAllRecharges);
router.get('/recharges/stats', adminWalletController.getRechargeStats);

// ── All Transactions ────────────────────────────────────────────
router.get('/transactions', adminWalletController.getAllTransactions);

// ── All Wallets ─────────────────────────────────────────────────
router.get('/wallets', adminWalletController.getAllWallets);

// ── Ad Pricing ──────────────────────────────────────────────────
router.get('/ad-pricing', adminWalletController.getAdPricing);
router.put('/ad-pricing', adminWalletController.setAdPricing);

// ── Credit Rules ────────────────────────────────────────────────
router.get('/credit-rules', adminWalletController.getAllCreditRules);
router.put('/credit-rules/:id', adminWalletController.updateCreditRule);

module.exports = router;

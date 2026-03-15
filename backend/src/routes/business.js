const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { requirePaidAccount } = require('../middleware/paidUser');
const biz = require('../controllers/businessController');
const { validateBusiness } = require('../middleware/validate');

// All routes require authentication + paid account
router.use(authenticate, requirePaidAccount);

// ─── Business ────────────────────────────────────────────────────────────────
router.post('/', validateBusiness, biz.createBusiness);
router.get('/', biz.getMyBusinesses);
router.get('/:id', biz.getBusiness);
router.put('/:id', biz.updateBusiness);

// ─── Team Members ────────────────────────────────────────────────────────────
router.post('/:id/members', biz.addMember);
router.delete('/:id/members/:userId', biz.removeMember);
router.put('/:id/members/:userId/role', biz.updateMemberRole);

// ─── Ad Accounts ─────────────────────────────────────────────────────────────
router.post('/ad-accounts', biz.createAdAccount);
router.get('/ad-accounts/my', biz.getMyAdAccounts);
router.get('/ad-accounts/:id', biz.getAdAccount);

// ─── Catalogs ────────────────────────────────────────────────────────────────
router.post('/catalogs', biz.createCatalog);
router.get('/catalogs', biz.getCatalogs);
router.get('/catalogs/:id', biz.getCatalog);
router.put('/catalogs/:id', biz.updateCatalog);
router.post('/catalogs/:id/products', biz.addProduct);
router.put('/catalogs/:id/products/:productId', biz.updateProduct);
router.post('/catalogs/:id/product-groups', biz.addProductGroup);

module.exports = router;

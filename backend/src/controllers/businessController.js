const Business = require('../models/Business');
const AdAccount = require('../models/AdAccount');
const Catalog = require('../models/Catalog');
const Campaign = require('../models/Campaign');
const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');
const { logActivity } = require('../services/adActivityService');

// ─── Business CRUD ───────────────────────────────────────────────────────────

exports.createBusiness = async (req, res) => {
  try {
    const { name, description, website, industry, billing } = req.body;

    const business = await Business.create({
      name,
      owner: req.user._id,
      description,
      website,
      industry,
      billing,
      members: [{ user: req.user._id, role: 'admin' }],
    });

    await logActivity({
      owner: req.user._id,
      actionType: 'BUSINESS_CREATED',
      entityType: 'Business',
      entityId: business._id,
      description: `Created business "${name}"`,
      req,
    });

    return ApiResponse.created(res, business, 'Business created');
  } catch (err) {
    return ApiResponse.error(res, err.message, 400);
  }
};

exports.getMyBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id },
      ],
    })
      .populate('members.user', 'username displayName avatar')
      .populate('adAccounts')
      .sort('-createdAt');

    return ApiResponse.success(res, businesses);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.getBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id)
      .populate('members.user', 'username displayName avatar email')
      .populate('adAccounts');

    if (!business) return ApiResponse.notFound(res, 'Business not found');

    // Check if user is a member or admin
    const isMember = business.members.some((m) => m.user._id.toString() === req.user._id.toString());
    if (!isMember && req.user.role !== 'admin') return ApiResponse.forbidden(res);

    return ApiResponse.success(res, business);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.updateBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return ApiResponse.notFound(res, 'Business not found');

    // Only owner or business admin can update
    const memberEntry = business.members.find((m) => m.user.toString() === req.user._id.toString());
    if (!memberEntry || (memberEntry.role !== 'admin' && business.owner.toString() !== req.user._id.toString())) {
      if (req.user.role !== 'admin') return ApiResponse.forbidden(res);
    }

    const fields = ['name', 'description', 'website', 'industry', 'billing', 'logo'];
    fields.forEach((f) => { if (req.body[f] !== undefined) business[f] = req.body[f]; });
    await business.save();

    await logActivity({
      owner: req.user._id,
      actionType: 'BUSINESS_UPDATED',
      entityType: 'Business',
      entityId: business._id,
      description: `Updated business "${business.name}"`,
      req,
    });

    return ApiResponse.success(res, business, 'Business updated');
  } catch (err) {
    return ApiResponse.error(res, err.message, 400);
  }
};

// ─── Team Members ────────────────────────────────────────────────────────────

exports.addMember = async (req, res) => {
  try {
    const { userId, role = 'viewer' } = req.body;
    const business = await Business.findById(req.params.id);
    if (!business) return ApiResponse.notFound(res, 'Business not found');

    // Only business admins can add members
    const caller = business.members.find((m) => m.user.toString() === req.user._id.toString());
    if (!caller || !['admin', 'manager'].includes(caller.role)) {
      if (req.user.role !== 'admin') return ApiResponse.forbidden(res, 'Only admins/managers can add members');
    }

    const alreadyMember = business.members.some((m) => m.user.toString() === userId);
    if (alreadyMember) return ApiResponse.error(res, 'User is already a member', 400);

    business.members.push({ user: userId, role });
    await business.save();

    await logActivity({
      owner: req.user._id,
      actionType: 'MEMBER_ADDED',
      entityType: 'Business',
      entityId: business._id,
      description: `Added member with role "${role}"`,
      metadata: { userId, role },
      req,
    });

    return ApiResponse.success(res, business, 'Member added');
  } catch (err) {
    return ApiResponse.error(res, err.message, 400);
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const business = await Business.findById(req.params.id);
    if (!business) return ApiResponse.notFound(res, 'Business not found');

    const caller = business.members.find((m) => m.user.toString() === req.user._id.toString());
    if (!caller || caller.role !== 'admin') {
      if (req.user.role !== 'admin') return ApiResponse.forbidden(res, 'Only admins can remove members');
    }

    if (business.owner.toString() === userId) {
      return ApiResponse.error(res, 'Cannot remove the business owner', 400);
    }

    business.members = business.members.filter((m) => m.user.toString() !== userId);
    await business.save();

    await logActivity({
      owner: req.user._id,
      actionType: 'MEMBER_REMOVED',
      entityType: 'Business',
      entityId: business._id,
      description: `Removed member`,
      metadata: { userId },
      req,
    });

    return ApiResponse.success(res, business, 'Member removed');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.updateMemberRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const business = await Business.findById(req.params.id);
    if (!business) return ApiResponse.notFound(res);

    const caller = business.members.find((m) => m.user.toString() === req.user._id.toString());
    if (!caller || caller.role !== 'admin') {
      if (req.user.role !== 'admin') return ApiResponse.forbidden(res);
    }

    const validRoles = ['admin', 'manager', 'analyst', 'viewer'];
    if (!validRoles.includes(role)) return ApiResponse.error(res, 'Invalid role', 400);

    const member = business.members.find((m) => m.user.toString() === userId);
    if (!member) return ApiResponse.notFound(res, 'Member not found');

    member.role = role;
    await business.save();

    await logActivity({
      owner: req.user._id,
      actionType: 'MEMBER_ROLE_CHANGED',
      entityType: 'Business',
      entityId: business._id,
      description: `Changed member role to "${role}"`,
      metadata: { userId, role },
      req,
    });

    return ApiResponse.success(res, business, 'Member role updated');
  } catch (err) {
    return ApiResponse.error(res, err.message, 400);
  }
};

// ─── Ad Accounts ─────────────────────────────────────────────────────────────

exports.createAdAccount = async (req, res) => {
  try {
    const { name, businessId, currency, timezone } = req.body;

    let business = null;
    if (businessId) {
      business = await Business.findById(businessId);
      if (!business) return ApiResponse.notFound(res, 'Business not found');
      const isMember = business.members.some((m) => m.user.toString() === req.user._id.toString());
      if (!isMember && req.user.role !== 'admin') return ApiResponse.forbidden(res);
    }

    const adAccount = await AdAccount.create({
      name,
      owner: req.user._id,
      business: businessId || null,
      currency,
      timezone,
    });

    if (business) {
      business.adAccounts.push(adAccount._id);
      await business.save();
    }

    await logActivity({
      owner: req.user._id,
      actionType: 'AD_ACCOUNT_CREATED',
      entityType: 'AdAccount',
      entityId: adAccount._id,
      description: `Created ad account "${name}"`,
      req,
    });

    return ApiResponse.created(res, adAccount, 'Ad account created');
  } catch (err) {
    return ApiResponse.error(res, err.message, 400);
  }
};

exports.getMyAdAccounts = async (req, res) => {
  try {
    const adAccounts = await AdAccount.find({ owner: req.user._id }).sort('-createdAt');
    return ApiResponse.success(res, adAccounts);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.getAdAccount = async (req, res) => {
  try {
    const adAccount = await AdAccount.findById(req.params.id).populate('business');
    if (!adAccount) return ApiResponse.notFound(res);
    if (adAccount.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res);
    }

    // Fetch linked campaigns count
    const campaignCount = await Campaign.countDocuments({ adAccount: adAccount._id });
    const activeCampaignCount = await Campaign.countDocuments({ adAccount: adAccount._id, status: 'active' });

    return ApiResponse.success(res, {
      ...adAccount.toJSON(),
      campaignCount,
      activeCampaignCount,
    });
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

// ─── Catalogs ────────────────────────────────────────────────────────────────

exports.createCatalog = async (req, res) => {
  try {
    const { name, businessId, description, feedUrl, feedType } = req.body;

    const business = await Business.findById(businessId);
    if (!business) return ApiResponse.notFound(res, 'Business not found');
    const isMember = business.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember && req.user.role !== 'admin') return ApiResponse.forbidden(res);

    const catalog = await Catalog.create({
      name,
      business: businessId,
      owner: req.user._id,
      description,
      feedUrl,
      feedType,
    });

    await logActivity({
      owner: req.user._id,
      actionType: 'CATALOG_CREATED',
      entityType: 'Catalog',
      entityId: catalog._id,
      description: `Created catalog "${name}"`,
      req,
    });

    return ApiResponse.created(res, catalog, 'Catalog created');
  } catch (err) {
    return ApiResponse.error(res, err.message, 400);
  }
};

exports.getCatalogs = async (req, res) => {
  try {
    const { businessId } = req.query;
    const filter = { owner: req.user._id };
    if (businessId) filter.business = businessId;

    const catalogs = await Catalog.find(filter).sort('-createdAt');
    return ApiResponse.success(res, catalogs);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.getCatalog = async (req, res) => {
  try {
    const catalog = await Catalog.findById(req.params.id).populate('business', 'name');
    if (!catalog) return ApiResponse.notFound(res);
    if (catalog.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res);
    }
    return ApiResponse.success(res, catalog);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.updateCatalog = async (req, res) => {
  try {
    const catalog = await Catalog.findById(req.params.id);
    if (!catalog) return ApiResponse.notFound(res);
    if (catalog.owner.toString() !== req.user._id.toString()) return ApiResponse.forbidden(res);

    const fields = ['name', 'description', 'feedUrl', 'feedType', 'status'];
    fields.forEach((f) => { if (req.body[f] !== undefined) catalog[f] = req.body[f]; });
    await catalog.save();

    await logActivity({
      owner: req.user._id,
      actionType: 'CATALOG_UPDATED',
      entityType: 'Catalog',
      entityId: catalog._id,
      description: `Updated catalog "${catalog.name}"`,
      req,
    });

    return ApiResponse.success(res, catalog, 'Catalog updated');
  } catch (err) {
    return ApiResponse.error(res, err.message, 400);
  }
};

// Product management inside catalogs
exports.addProduct = async (req, res) => {
  try {
    const catalog = await Catalog.findById(req.params.id);
    if (!catalog) return ApiResponse.notFound(res);
    if (catalog.owner.toString() !== req.user._id.toString()) return ApiResponse.forbidden(res);

    catalog.products.push(req.body);
    await catalog.save();

    await logActivity({
      owner: req.user._id,
      actionType: 'PRODUCT_ADDED',
      entityType: 'Catalog',
      entityId: catalog._id,
      description: `Added product to catalog "${catalog.name}"`,
      req,
    });

    return ApiResponse.created(res, catalog, 'Product added');
  } catch (err) {
    return ApiResponse.error(res, err.message, 400);
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const catalog = await Catalog.findById(req.params.id);
    if (!catalog) return ApiResponse.notFound(res);
    if (catalog.owner.toString() !== req.user._id.toString()) return ApiResponse.forbidden(res);

    const product = catalog.products.id(req.params.productId);
    if (!product) return ApiResponse.notFound(res, 'Product not found');

    Object.assign(product, req.body);
    await catalog.save();

    await logActivity({
      owner: req.user._id,
      actionType: 'PRODUCT_UPDATED',
      entityType: 'Catalog',
      entityId: catalog._id,
      description: `Updated product in catalog "${catalog.name}"`,
      req,
    });

    return ApiResponse.success(res, catalog, 'Product updated');
  } catch (err) {
    return ApiResponse.error(res, err.message, 400);
  }
};

// Product groups
exports.addProductGroup = async (req, res) => {
  try {
    const catalog = await Catalog.findById(req.params.id);
    if (!catalog) return ApiResponse.notFound(res);
    if (catalog.owner.toString() !== req.user._id.toString()) return ApiResponse.forbidden(res);

    catalog.productGroups.push(req.body);
    await catalog.save();
    return ApiResponse.created(res, catalog, 'Product group added');
  } catch (err) {
    return ApiResponse.error(res, err.message, 400);
  }
};

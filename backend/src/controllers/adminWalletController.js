const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const CreditRule = require('../models/CreditRule');
const User = require('../models/User');
const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');

// ─── Admin: All Wallet Recharges ──────────────────────────────────────────────

/**
 * Get all wallet recharges/top-ups (purchases & bonuses)
 * Admin can see every user's wallet recharge history
 */
exports.getAllRecharges = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      source,
      search,
      startDate,
      endDate,
      sort = 'createdAt',
      order = 'desc',
      minAmount,
      maxAmount,
    } = req.query;

    const { skip } = paginate(null, page, limit);

    // Only purchase & bonus types are recharges
    const filter = { type: { $in: ['purchase', 'bonus'] }, status: 'completed' };

    if (source) filter.source = source;
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Build query
    let query = Transaction.find(filter);

    // If search is provided, first find matching user IDs
    if (search) {
      const matchingUsers = await User.find({
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { displayName: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      filter.user = { $in: matchingUsers.map((u) => u._id) };
      query = Transaction.find(filter);
    }

    const sortField = {
      createdAt: 'createdAt',
      amount: 'amount',
      balanceAfter: 'balanceAfter',
    }[sort] || 'createdAt';

    const [recharges, total] = await Promise.all([
      query
        .sort({ [sortField]: order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'username displayName avatar email')
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, recharges, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

/**
 * Recharge summary statistics for admin dashboard
 */
exports.getRechargeStats = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [
      totalStats,
      dailyRecharges,
      topRechargers,
      bySource,
    ] = await Promise.all([
      // Overall totals
      Transaction.aggregate([
        { $match: { type: { $in: ['purchase', 'bonus'] }, status: 'completed', createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalCount: { $sum: 1 },
            avgAmount: { $avg: '$amount' },
            uniqueUsers: { $addToSet: '$user' },
            maxRecharge: { $max: '$amount' },
          },
        },
        {
          $addFields: { uniqueUserCount: { $size: '$uniqueUsers' } },
        },
        { $project: { uniqueUsers: 0, _id: 0 } },
      ]),
      // Daily breakdown
      Transaction.aggregate([
        { $match: { type: { $in: ['purchase', 'bonus'] }, status: 'completed', createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Top rechargers
      Transaction.aggregate([
        { $match: { type: { $in: ['purchase', 'bonus'] }, status: 'completed', createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$user',
            totalRecharged: { $sum: '$amount' },
            rechargeCount: { $sum: 1 },
            lastRecharge: { $max: '$createdAt' },
          },
        },
        { $sort: { totalRecharged: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
            pipeline: [{ $project: { username: 1, displayName: 1, avatar: 1, email: 1 } }],
          },
        },
        { $unwind: '$user' },
      ]),
      // By source
      Transaction.aggregate([
        { $match: { type: { $in: ['purchase', 'bonus'] }, status: 'completed', createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$source',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),
    ]);

    ApiResponse.success(res, {
      summary: totalStats[0] || { totalAmount: 0, totalCount: 0, avgAmount: 0, uniqueUserCount: 0, maxRecharge: 0 },
      dailyRecharges,
      topRechargers,
      bySource,
      period: `${days} days`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all transactions (admin overview - all types)
 */
exports.getAllTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      source,
      status,
      search,
      startDate,
      endDate,
    } = req.query;

    const { skip } = paginate(null, page, limit);
    const filter = {};

    if (type) filter.type = type;
    if (source) filter.source = source;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      const matchingUsers = await User.find({
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      filter.user = { $in: matchingUsers.map((u) => u._id) };
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'username displayName avatar email')
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, transactions, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// ─── Admin: Ad Pricing Management ─────────────────────────────────────────────

/**
 * Get the current ad posting price
 */
exports.getAdPricing = async (req, res, next) => {
  try {
    const adRule = await CreditRule.findOne({ feature: 'ad_posting' });
    ApiResponse.success(res, adRule || { message: 'Ad posting price not set' });
  } catch (error) {
    next(error);
  }
};

/**
 * Set or update ad posting price (admin only)
 */
exports.setAdPricing = async (req, res, next) => {
  try {
    const { baseCost, description, isDynamic, dynamicFormula, minCredits, maxCredits, isActive } = req.body;

    if (baseCost === undefined || baseCost < 0) {
      return ApiResponse.error(res, 'baseCost is required and must be >= 0', 400);
    }

    let adRule = await CreditRule.findOne({ feature: 'ad_posting' });

    if (adRule) {
      // Update existing rule
      adRule.baseCost = baseCost;
      if (description !== undefined) adRule.description = description;
      if (isDynamic !== undefined) adRule.isDynamic = isDynamic;
      if (dynamicFormula !== undefined) adRule.dynamicFormula = dynamicFormula;
      if (minCredits !== undefined) adRule.minCredits = minCredits;
      if (maxCredits !== undefined) adRule.maxCredits = maxCredits;
      if (isActive !== undefined) adRule.isActive = isActive;
      adRule.category = 'promotion';
      adRule.updatedBy = req.user._id;
      await adRule.save();
    } else {
      // Create new rule
      adRule = await CreditRule.create({
        feature: 'ad_posting',
        baseCost,
        description: description || 'Credit cost for posting a paid advertisement',
        isDynamic: isDynamic || false,
        dynamicFormula: dynamicFormula || null,
        category: 'promotion',
        isActive: isActive !== undefined ? isActive : true,
        minCredits: minCredits || 1,
        maxCredits: maxCredits || 100000,
        updatedBy: req.user._id,
      });
    }

    ApiResponse.success(res, adRule, 'Ad posting price updated');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all credit rules (admin overview)
 */
exports.getAllCreditRules = async (req, res, next) => {
  try {
    const rules = await CreditRule.find()
      .sort({ feature: 1 })
      .populate('updatedBy', 'username displayName')
      .lean();

    ApiResponse.success(res, rules);
  } catch (error) {
    next(error);
  }
};

/**
 * Update any credit rule by ID
 */
exports.updateCreditRule = async (req, res, next) => {
  try {
    const { baseCost, description, isDynamic, dynamicFormula, isActive, minCredits, maxCredits } = req.body;

    const rule = await CreditRule.findById(req.params.id);
    if (!rule) return ApiResponse.notFound(res, 'Credit rule not found');

    if (baseCost !== undefined) rule.baseCost = baseCost;
    if (description !== undefined) rule.description = description;
    if (isDynamic !== undefined) rule.isDynamic = isDynamic;
    if (dynamicFormula !== undefined) rule.dynamicFormula = dynamicFormula;
    if (isActive !== undefined) rule.isActive = isActive;
    if (minCredits !== undefined) rule.minCredits = minCredits;
    if (maxCredits !== undefined) rule.maxCredits = maxCredits;
    rule.updatedBy = req.user._id;

    await rule.save();
    ApiResponse.success(res, rule, 'Credit rule updated');
  } catch (error) {
    next(error);
  }
};

// ─── Admin: All Wallets Overview ──────────────────────────────────────────────

/**
 * Get all user wallets with balances (admin)
 */
exports.getAllWallets = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, sort = 'balance', order = 'desc', frozen } = req.query;
    const { skip } = paginate(null, page, limit);

    const pipeline = [];

    // Lookup user info
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userInfo',
        pipeline: [{ $project: { username: 1, displayName: 1, avatar: 1, email: 1, role: 1 } }],
      },
    });
    pipeline.push({ $unwind: '$userInfo' });

    // Search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'userInfo.username': { $regex: search, $options: 'i' } },
            { 'userInfo.email': { $regex: search, $options: 'i' } },
            { 'userInfo.displayName': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    // Frozen filter
    if (frozen === 'true') pipeline.push({ $match: { isFrozen: true } });
    if (frozen === 'false') pipeline.push({ $match: { isFrozen: { $ne: true } } });

    // Count before pagination
    const countPipeline = [...pipeline, { $count: 'total' }];

    // Sort
    const sortField = {
      balance: 'balance',
      totalPurchased: 'totalPurchased',
      totalUsed: 'totalUsed',
      createdAt: 'createdAt',
    }[sort] || 'balance';
    pipeline.push({ $sort: { [sortField]: order === 'asc' ? 1 : -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    const [wallets, countResult] = await Promise.all([
      Wallet.aggregate(pipeline),
      Wallet.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;
    ApiResponse.paginated(res, wallets, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

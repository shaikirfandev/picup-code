const AdActivityLog = require('../models/AdActivityLog');
const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');

exports.getActivityTimeline = async (req, res) => {
  try {
    const { page = 1, limit = 30, actionType, entityType, startDate, endDate } = req.query;
    const { skip } = paginate(req.query, page, limit);

    const filter = { owner: req.user._id };
    if (actionType) filter.actionType = actionType;
    if (entityType) filter.entityType = entityType;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      AdActivityLog.find(filter)
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .populate('entityId'),
      AdActivityLog.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, logs, getPaginationMeta(total, page, limit));
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.getActivityStats = async (req, res) => {
  try {
    const stats = await AdActivityLog.aggregate([
      { $match: { owner: req.user._id } },
      {
        $group: {
          _id: '$actionType',
          count: { $sum: 1 },
          lastOccurrence: { $max: '$createdAt' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return ApiResponse.success(res, stats);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

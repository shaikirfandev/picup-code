const Post = require('../models/Post');
const User = require('../models/User');
const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');

// Search posts
exports.searchPosts = async (req, res, next) => {
  try {
    const { q, category, tag, minPrice, maxPrice, sort = 'relevant', page = 1, limit = 30 } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = { status: 'published' };

    if (q) {
      filter.$text = { $search: q };
    }
    if (category) filter.category = category;
    if (tag) filter.tags = tag.toLowerCase();
    if (minPrice || maxPrice) {
      filter['price.amount'] = {};
      if (minPrice) filter['price.amount'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['price.amount'].$lte = parseFloat(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (q && sort === 'relevant') {
      sortOption = { score: { $meta: 'textScore' }, createdAt: -1 };
    }
    if (sort === 'popular') sortOption = { likesCount: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { 'price.amount': 1 };
    if (sort === 'price_desc') sortOption = { 'price.amount': -1 };

    let query = Post.find(filter);
    if (q && sort === 'relevant') {
      query = query.select({ score: { $meta: 'textScore' } });
    }

    const [posts, total] = await Promise.all([
      query
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('author', 'username displayName avatar')
        .populate('category', 'name slug color')
        .lean(),
      Post.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, posts, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// Search users
exports.searchUsers = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = { status: 'active' };
    if (q) {
      filter.$or = [
        { username: { $regex: q, $options: 'i' } },
        { displayName: { $regex: q, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ followersCount: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('username displayName avatar bio followersCount postsCount'),
      User.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, users, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// Get trending tags
exports.getTrendingTags = async (req, res, next) => {
  try {
    const tags = await Post.aggregate([
      { $match: { status: 'published', createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    ApiResponse.success(res, tags.map((t) => ({ tag: t._id, count: t.count })));
  } catch (error) {
    next(error);
  }
};

// Get trending posts
exports.getTrendingPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({
      status: 'published',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    })
      .sort({ viewsCount: -1, likesCount: -1 })
      .limit(20)
      .populate('author', 'username displayName avatar')
      .populate('category', 'name slug color')
      .lean();

    ApiResponse.success(res, posts);
  } catch (error) {
    next(error);
  }
};

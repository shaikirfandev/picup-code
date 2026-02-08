const User = require('../models/User');
const Post = require('../models/Post');
const { Follow } = require('../models/Interaction');
const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// Get user profile by username
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({
      username: req.params.username.toLowerCase(),
    }).select('-refreshToken');

    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    let isFollowing = false;
    if (req.user) {
      const follow = await Follow.findOne({
        follower: req.user._id,
        following: user._id,
      });
      isFollowing = !!follow;
    }

    ApiResponse.success(res, {
      ...user.toObject(),
      isFollowing,
    });
  } catch (error) {
    next(error);
  }
};

// Get user posts
exports.getUserPosts = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return ApiResponse.notFound(res, 'User not found');

    const { page = 1, limit = 20 } = req.query;
    const { skip } = paginate(null, page, limit);

    const [posts, total] = await Promise.all([
      Post.find({ author: user._id, status: 'published' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('category', 'name slug')
        .lean(),
      Post.countDocuments({ author: user._id, status: 'published' }),
    ]);

    ApiResponse.paginated(res, posts, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// Update profile
exports.updateProfile = async (req, res, next) => {
  try {
    const updates = {};
    const allowedFields = ['displayName', 'bio', 'website', 'location'];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    ApiResponse.success(res, user, 'Profile updated');
  } catch (error) {
    next(error);
  }
};

// Upload avatar
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.error(res, 'No file uploaded', 400);
    }

    // Delete old avatar if exists
    if (req.user.avatarPublicId) {
      await deleteFromCloudinary(req.user.avatarPublicId);
    }

    const result = await uploadToCloudinary(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
      {
        folder: 'picup/avatars',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
      }
    );

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: result.url, avatarPublicId: result.publicId },
      { new: true }
    );

    ApiResponse.success(res, user, 'Avatar updated');
  } catch (error) {
    next(error);
  }
};

// Follow user
exports.followUser = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return ApiResponse.notFound(res, 'User not found');

    if (targetUser._id.toString() === req.user._id.toString()) {
      return ApiResponse.error(res, 'You cannot follow yourself', 400);
    }

    const existingFollow = await Follow.findOne({
      follower: req.user._id,
      following: targetUser._id,
    });

    if (existingFollow) {
      return ApiResponse.error(res, 'Already following this user', 400);
    }

    await Follow.create({
      follower: req.user._id,
      following: targetUser._id,
    });

    await Promise.all([
      User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: 1 } }),
      User.findByIdAndUpdate(targetUser._id, { $inc: { followersCount: 1 } }),
    ]);

    ApiResponse.success(res, { isFollowing: true }, 'User followed');
  } catch (error) {
    next(error);
  }
};

// Unfollow user
exports.unfollowUser = async (req, res, next) => {
  try {
    const result = await Follow.findOneAndDelete({
      follower: req.user._id,
      following: req.params.id,
    });

    if (!result) {
      return ApiResponse.error(res, 'Not following this user', 400);
    }

    await Promise.all([
      User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: -1 } }),
      User.findByIdAndUpdate(req.params.id, { $inc: { followersCount: -1 } }),
    ]);

    ApiResponse.success(res, { isFollowing: false }, 'User unfollowed');
  } catch (error) {
    next(error);
  }
};

// Get followers
exports.getFollowers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { skip } = paginate(null, page, limit);

    const user = await User.findOne({ username: req.params.username });
    if (!user) return ApiResponse.notFound(res, 'User not found');

    const [follows, total] = await Promise.all([
      Follow.find({ following: user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('follower', 'username displayName avatar bio'),
      Follow.countDocuments({ following: user._id }),
    ]);

    const followers = follows.map((f) => f.follower);
    ApiResponse.paginated(res, followers, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// Get following
exports.getFollowing = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { skip } = paginate(null, page, limit);

    const user = await User.findOne({ username: req.params.username });
    if (!user) return ApiResponse.notFound(res, 'User not found');

    const [follows, total] = await Promise.all([
      Follow.find({ follower: user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('following', 'username displayName avatar bio'),
      Follow.countDocuments({ follower: user._id }),
    ]);

    const following = follows.map((f) => f.following);
    ApiResponse.paginated(res, following, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// Get suggested users
exports.getSuggestedUsers = async (req, res, next) => {
  try {
    const following = await Follow.find({ follower: req.user._id }).select('following');
    const followingIds = following.map((f) => f.following);

    const users = await User.find({
      _id: { $nin: [...followingIds, req.user._id] },
      status: 'active',
    })
      .sort({ followersCount: -1 })
      .limit(10)
      .select('username displayName avatar bio followersCount');

    ApiResponse.success(res, users);
  } catch (error) {
    next(error);
  }
};

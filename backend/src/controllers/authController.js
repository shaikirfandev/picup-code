const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateTokens } = require('../middleware/auth');
const { ApiResponse } = require('../utils/apiResponse');

// Register
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, displayName } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username: username.toLowerCase() }] });
    if (existingUser) {
      return ApiResponse.error(res, 'Email or username already exists', 400);
    }

    const user = await User.create({
      username: username.toLowerCase(),
      email,
      password,
      displayName: displayName || username,
    });

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    user.loginCount = 1;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    ApiResponse.created(res, {
      user: userResponse,
      accessToken,
      refreshToken,
    }, 'Registration successful');
  } catch (error) {
    next(error);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return ApiResponse.error(res, 'Invalid credentials', 401);
    }

    if (!user.password) {
      return ApiResponse.error(res, 'Please login with your social account (Google/GitHub)', 400);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return ApiResponse.error(res, 'Invalid credentials', 401);
    }

    if (user.status === 'banned') {
      return ApiResponse.error(res, 'Your account has been banned', 403);
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    ApiResponse.success(res, {
      user: userResponse,
      accessToken,
      refreshToken,
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// OAuth callback handler
exports.oauthCallback = async (req, res, next) => {
  try {
    const user = req.user;
    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save();

    // Redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&refresh=${refreshToken}`);
  } catch (error) {
    next(error);
  }
};

// Refresh token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return ApiResponse.error(res, 'Refresh token required', 400);
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return ApiResponse.error(res, 'Invalid refresh token', 401);
    }

    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    ApiResponse.success(res, tokens, 'Token refreshed');
  } catch (error) {
    return ApiResponse.error(res, 'Invalid refresh token', 401);
  }
};

// Get current user
exports.getMe = async (req, res) => {
  ApiResponse.success(res, req.user, 'User profile');
};

// Logout
exports.logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    ApiResponse.success(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (user.password) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return ApiResponse.error(res, 'Current password is incorrect', 400);
      }
    }

    user.password = newPassword;
    await user.save();

    ApiResponse.success(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

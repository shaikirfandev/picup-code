const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      lowercase: true,
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    avatarPublicId: String,
    coverImage: {
      type: String,
      default: '',
    },
    website: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    googleId: String,
    githubId: String,
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 },
    aiGenerationsToday: { type: Number, default: 0 },
    aiGenerationsTotal: { type: Number, default: 0 },
    aiDailyLimit: { type: Number, default: 10 },
    lastAiResetDate: { type: Date, default: Date.now },
    refreshToken: { type: String, select: false },
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
    loginCount: { type: Number, default: 0 },
    lastLoginIP: String,
    lastLoginDevice: String,
    lastLoginCountry: String,
    isActiveToday: { type: Boolean, default: false },
    // Account type: free or paid (for ad account features)
    accountType: {
      type: String,
      enum: ['free', 'paid'],
      default: 'free',
    },
    // Subscription details for paid accounts
    subscription: {
      plan: { type: String, enum: ['none', 'basic', 'pro', 'enterprise'], default: 'none' },
      startDate: Date,
      endDate: Date,
      isActive: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userSchema.index({ username: 'text', displayName: 'text' });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Reset daily AI generations
userSchema.methods.checkAiReset = function () {
  const now = new Date();
  const lastReset = new Date(this.lastAiResetDate);
  if (now.toDateString() !== lastReset.toDateString()) {
    this.aiGenerationsToday = 0;
    this.lastAiResetDate = now;
  }
};

// Virtual for profile URL
userSchema.virtual('profileUrl').get(function () {
  return `/profile/${this.username}`;
});

module.exports = mongoose.model('User', userSchema);

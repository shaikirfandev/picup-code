const mongoose = require('mongoose');

/**
 * AffiliateClick — detailed tracking for affiliate/product link clicks.
 * Separate from PostEvent for dedicated affiliate analytics.
 */
const affiliateClickSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clickerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    productUrl: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown',
    },
    browser: { type: String, default: null },
    os: { type: String, default: null },
    country: { type: String, default: null },
    city: { type: String, default: null },
    referrer: {
      type: String,
      enum: ['home_feed', 'search', 'profile', 'external', 'direct', 'notification', 'board', 'unknown'],
      default: 'unknown',
    },
    // Fraud detection
    isBot: { type: Boolean, default: false },
    isSuspicious: { type: Boolean, default: false },
    suspicionReason: { type: String, default: null },
    // Conversion tracking
    converted: { type: Boolean, default: false },
    conversionValue: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Indexes for affiliate analytics queries
affiliateClickSchema.index({ postId: 1, createdAt: -1 });
affiliateClickSchema.index({ ownerId: 1, createdAt: -1 });
affiliateClickSchema.index({ productUrl: 1, createdAt: -1 });
affiliateClickSchema.index({ ownerId: 1, postId: 1, createdAt: -1 });
// Deduplication
affiliateClickSchema.index({ postId: 1, sessionId: 1, createdAt: -1 });
// TTL: 180 days
affiliateClickSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

module.exports = mongoose.model('AffiliateClick', affiliateClickSchema);

const mongoose = require('mongoose');

/**
 * PostEvent — event-driven tracking for all post interactions.
 * Events are batched from Redis and written periodically for performance.
 * 
 * Supports: view, like, unlike, share, click, save, unsave, comment
 */
const postEventSchema = new mongoose.Schema(
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
    viewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    eventType: {
      type: String,
      required: true,
      enum: ['view', 'like', 'unlike', 'share', 'click', 'save', 'unsave', 'comment'],
      index: true,
    },
    sessionId: {
      type: String,
      default: null,
      index: true,
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
    browser: {
      type: String,
      default: null,
    },
    os: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
    referrer: {
      type: String,
      enum: ['home_feed', 'search', 'profile', 'external', 'direct', 'notification', 'board', 'unknown'],
      default: 'unknown',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // For video events
    watchDuration: {
      type: Number,
      default: null,
    },
    completionRate: {
      type: Number,
      default: null,
    },
    // Affiliate tracking
    affiliateUrl: {
      type: String,
      default: null,
    },
    // Bot detection
    isBot: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    // Use a capped collection alternative: TTL index for auto-cleanup of raw events after 90 days
  }
);

// Compound indexes for efficient querying
postEventSchema.index({ postId: 1, eventType: 1, createdAt: -1 });
postEventSchema.index({ ownerId: 1, eventType: 1, createdAt: -1 });
postEventSchema.index({ ownerId: 1, createdAt: -1 });
postEventSchema.index({ postId: 1, createdAt: -1 });
postEventSchema.index({ createdAt: -1 });
// For deduplication of views
postEventSchema.index({ postId: 1, sessionId: 1, eventType: 1, createdAt: -1 });
// TTL: auto-delete raw events after 90 days (aggregated data is kept in PostAnalyticsDaily)
postEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('PostEvent', postEventSchema);

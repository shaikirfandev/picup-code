const mongoose = require('mongoose');

/**
 * PostAnalyticsDaily — pre-aggregated daily analytics per post.
 * Computed by background worker from PostEvent collection.
 * Used for fast dashboard queries without scanning raw events.
 */
const postAnalyticsDailySchema = new mongoose.Schema(
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
    date: {
      type: String, // YYYY-MM-DD format
      required: true,
    },
    // Core metrics
    impressions: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    unlikes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    unsaves: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },

    // Calculated metrics
    ctr: { type: Number, default: 0 }, // clicks / impressions
    engagementRate: { type: Number, default: 0 }, // (likes+comments+shares+saves) / impressions

    // Video metrics
    avgWatchDuration: { type: Number, default: 0 },
    avgCompletionRate: { type: Number, default: 0 },

    // Device breakdown
    deviceBreakdown: {
      desktop: { type: Number, default: 0 },
      mobile: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 },
      unknown: { type: Number, default: 0 },
    },

    // Traffic sources
    trafficSources: {
      home_feed: { type: Number, default: 0 },
      search: { type: Number, default: 0 },
      profile: { type: Number, default: 0 },
      external: { type: Number, default: 0 },
      direct: { type: Number, default: 0 },
      notification: { type: Number, default: 0 },
      board: { type: Number, default: 0 },
      unknown: { type: Number, default: 0 },
    },

    // Geo distribution (top 20)
    topCountries: [
      {
        country: String,
        count: Number,
        _id: false,
      },
    ],

    // Hourly distribution (0-23)
    hourlyDistribution: {
      type: [Number],
      default: () => new Array(24).fill(0),
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound: one record per post per day
postAnalyticsDailySchema.index({ postId: 1, date: 1 }, { unique: true });
// For creator dashboard queries
postAnalyticsDailySchema.index({ ownerId: 1, date: -1 });
postAnalyticsDailySchema.index({ ownerId: 1, postId: 1, date: -1 });
// For aggregation queries across dates
postAnalyticsDailySchema.index({ date: -1 });

module.exports = mongoose.model('PostAnalyticsDaily', postAnalyticsDailySchema);

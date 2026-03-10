const mongoose = require('mongoose');

/**
 * CreatorAnalyticsSnapshot — periodic snapshots of creator-level aggregated metrics.
 * One record per creator per day for fast dashboard loading.
 */
const creatorAnalyticsSnapshotSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    // Aggregate counts
    totalPosts: { type: Number, default: 0 },
    totalImpressions: { type: Number, default: 0 },
    totalUniqueViews: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalShares: { type: Number, default: 0 },
    totalSaves: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
    totalAffiliateClicks: { type: Number, default: 0 },

    // Calculated
    ctr: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    estimatedRevenue: { type: Number, default: 0 },

    // Follower tracking
    followersCount: { type: Number, default: 0 },
    followersGained: { type: Number, default: 0 },
    followersLost: { type: Number, default: 0 },
    netFollowerGrowth: { type: Number, default: 0 },

    // Performance scores
    performanceScore: { type: Number, default: 0 },
    viralProbabilityScore: { type: Number, default: 0 },

    // Best performing post of the day
    topPost: {
      postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
      title: String,
      impressions: Number,
      engagementRate: Number,
    },

    // Device breakdown (aggregated)
    deviceBreakdown: {
      desktop: { type: Number, default: 0 },
      mobile: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 },
      unknown: { type: Number, default: 0 },
    },

    // Audience active hours
    audienceActiveHours: {
      type: [Number],
      default: () => new Array(24).fill(0),
    },
  },
  {
    timestamps: true,
  }
);

creatorAnalyticsSnapshotSchema.index({ userId: 1, date: 1 }, { unique: true });
creatorAnalyticsSnapshotSchema.index({ userId: 1, date: -1 });
creatorAnalyticsSnapshotSchema.index({ date: -1 });

module.exports = mongoose.model('CreatorAnalyticsSnapshot', creatorAnalyticsSnapshotSchema);

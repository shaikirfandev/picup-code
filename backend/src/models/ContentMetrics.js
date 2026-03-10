const mongoose = require('mongoose');

/**
 * ContentMetrics — Aggregated per-post content performance metrics.
 * Stores rolled-up lifetime + period-based snapshots for fast dashboard reads.
 * Populated by the analytics aggregation worker.
 */
const contentMetricsSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // — Lifetime Counters —
    totalViews: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    totalShares: { type: Number, default: 0 },
    totalSaves: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },

    // — Rates (computed) —
    engagementRate: { type: Number, default: 0 },     // (likes+comments+shares+saves) / views * 100
    clickThroughRate: { type: Number, default: 0 },    // clicks / views * 100

    // — Video-specific —
    totalWatchTime: { type: Number, default: 0 },      // seconds
    averageWatchTime: { type: Number, default: 0 },    // seconds
    completionRate: { type: Number, default: 0 },      // percent who watched to end

    // — Performance Classification —
    performanceScore: { type: Number, default: 0 },    // 0-100 composite
    performanceTier: {
      type: String,
      enum: ['low', 'average', 'good', 'viral', 'mega-viral'],
      default: 'low',
    },
    isTopPerforming: { type: Boolean, default: false },

    // — Trend Data (last 7 snapshots for sparklines) —
    viewsTrend: [{ date: String, value: Number }],
    engagementTrend: [{ date: String, value: Number }],

    // — Heatmap: hourly engagement distribution —
    hourlyDistribution: {
      type: Map,
      of: Number,
      default: {},
    },

    // — Last computed —
    lastAggregatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

contentMetricsSchema.index({ creator: 1, performanceScore: -1 });
contentMetricsSchema.index({ creator: 1, totalViews: -1 });
contentMetricsSchema.index({ creator: 1, engagementRate: -1 });
contentMetricsSchema.index({ post: 1 }, { unique: true });

module.exports = mongoose.model('ContentMetrics', contentMetricsSchema);

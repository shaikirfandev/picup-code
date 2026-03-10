const mongoose = require('mongoose');

/**
 * AudienceDemographic — Pre-aggregated audience breakdown per creator.
 * Updated daily by the analytics aggregation worker.
 */
const audienceDemographicSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // — Snapshot date —
    date: { type: String, required: true }, // YYYY-MM-DD

    // — Total audience size —
    totalFollowers: { type: Number, default: 0 },
    totalProfileVisits: { type: Number, default: 0 },
    totalContentViewers: { type: Number, default: 0 },

    // — Age Distribution —
    ageGroups: {
      '13-17': { type: Number, default: 0 },
      '18-24': { type: Number, default: 0 },
      '25-34': { type: Number, default: 0 },
      '35-44': { type: Number, default: 0 },
      '45-54': { type: Number, default: 0 },
      '55+': { type: Number, default: 0 },
    },

    // — Gender Distribution —
    genderDistribution: {
      male: { type: Number, default: 0 },
      female: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
      unknown: { type: Number, default: 0 },
    },

    // — Geographic Distribution (top countries/cities) —
    countries: [
      {
        code: String,
        name: String,
        count: Number,
        percentage: Number,
      },
    ],
    cities: [
      {
        name: String,
        country: String,
        count: Number,
        percentage: Number,
      },
    ],

    // — Active Hours (0-23 UTC) —
    activeHours: {
      type: Map,
      of: Number, // hour -> engagement count
      default: {},
    },

    // — Active Days (0=Sun, 6=Sat) —
    activeDays: {
      type: Map,
      of: Number,
      default: {},
    },

    // — Engagement Segmentation —
    engagementSegments: {
      superFans: { type: Number, default: 0 },       // daily engagers
      activeFans: { type: Number, default: 0 },       // weekly engagers
      casualViewers: { type: Number, default: 0 },    // monthly engagers
      dormant: { type: Number, default: 0 },           // no engagement 30d+
    },

    // — Follower vs Non-follower engagement ratio —
    followerEngagementRate: { type: Number, default: 0 },
    nonFollowerEngagementRate: { type: Number, default: 0 },
    followerToNonFollowerRatio: { type: Number, default: 0 },

    // — Device & Platform breakdown —
    devices: {
      mobile: { type: Number, default: 0 },
      desktop: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 },
    },

    browsers: {
      type: Map,
      of: Number,
      default: {},
    },

    operatingSystems: {
      type: Map,
      of: Number,
      default: {},
    },

    // — Traffic Sources —
    trafficSources: {
      direct: { type: Number, default: 0 },
      search: { type: Number, default: 0 },
      social: { type: Number, default: 0 },
      referral: { type: Number, default: 0 },
      email: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },

    // — New vs Returning —
    newViewers: { type: Number, default: 0 },
    returningViewers: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

audienceDemographicSchema.index({ creator: 1, date: -1 }, { unique: true });
audienceDemographicSchema.index({ creator: 1, createdAt: -1 });

module.exports = mongoose.model('AudienceDemographic', audienceDemographicSchema);

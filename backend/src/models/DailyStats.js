const mongoose = require('mongoose');

const dailyStatsSchema = new mongoose.Schema(
  {
    date: {
      type: String, // YYYY-MM-DD format for easy querying
      required: true,
      unique: true,
    },
    newUsers: { type: Number, default: 0 },
    logins: { type: Number, default: 0 },
    uniqueLogins: { type: Number, default: 0 },
    posts: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    aiGenerations: { type: Number, default: 0 },
    reports: { type: Number, default: 0 },
    blogPosts: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    // Breakdown
    loginsByMethod: {
      email: { type: Number, default: 0 },
      google: { type: Number, default: 0 },
      github: { type: Number, default: 0 },
    },
    loginsByDevice: {
      desktop: { type: Number, default: 0 },
      mobile: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 },
      unknown: { type: Number, default: 0 },
    },
    topCountries: [
      {
        country: String,
        count: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

dailyStatsSchema.index({ date: -1 });

module.exports = mongoose.model('DailyStats', dailyStatsSchema);

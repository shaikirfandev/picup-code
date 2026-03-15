const mongoose = require('mongoose');

const campaignDailyStatsSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    adGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdGroup',
      default: null,
    },
    date: {
      type: Date,
      required: true,
    },
    impressions: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    cpc: { type: Number, default: 0 },
    cpm: { type: Number, default: 0 },
    costPerConversion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

campaignDailyStatsSchema.index({ campaign: 1, date: -1 });
campaignDailyStatsSchema.index({ adGroup: 1, date: -1 });
campaignDailyStatsSchema.index({ date: 1 });

module.exports = mongoose.model('CampaignDailyStats', campaignDailyStatsSchema);

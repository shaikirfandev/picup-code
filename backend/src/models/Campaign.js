const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
      maxlength: 200,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      default: null,
    },
    adAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdAccount',
      default: null,
    },
    objective: {
      type: String,
      enum: ['awareness', 'traffic', 'engagement', 'leads', 'conversions', 'sales'],
      default: 'awareness',
    },
    budget: {
      total: { type: Number, default: 0, min: 0 },
      daily: { type: Number, default: 0, min: 0 },
      spent: { type: Number, default: 0, min: 0 },
      currency: { type: String, enum: ['USD', 'INR'], default: 'USD' },
    },
    schedule: {
      startDate: { type: Date, default: Date.now },
      endDate: { type: Date },
      timezone: { type: String, default: 'UTC' },
    },
    targetAudience: {
      ageMin: { type: Number, default: 18 },
      ageMax: { type: Number, default: 65 },
      genders: [{ type: String, enum: ['male', 'female', 'all'] }],
      locations: [String],
      interests: [String],
      languages: [String],
      devices: [{ type: String, enum: ['mobile', 'desktop', 'tablet', 'all'] }],
    },
    creatives: [
      {
        type: { type: String, enum: ['image', 'video', 'carousel', 'text'], default: 'image' },
        title: String,
        description: String,
        imageUrl: String,
        videoUrl: String,
        callToAction: String,
        redirectUrl: String,
      },
    ],
    placement: {
      type: [String],
      enum: ['feed', 'sidebar', 'banner', 'search', 'stories'],
      default: ['feed'],
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'active', 'paused', 'completed', 'archived', 'rejected'],
      default: 'draft',
    },
    // Analytics aggregates
    metrics: {
      impressions: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      engagement: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      cpc: { type: Number, default: 0 },
      cpm: { type: Number, default: 0 },
      costPerConversion: { type: Number, default: 0 },
      roi: { type: Number, default: 0 },
    },
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

campaignSchema.index({ owner: 1, createdAt: -1 });
campaignSchema.index({ business: 1, status: 1 });
campaignSchema.index({ adAccount: 1, status: 1 });
campaignSchema.index({ status: 1, 'schedule.startDate': 1, 'schedule.endDate': 1 });

// Recalculate CTR on save
campaignSchema.pre('save', function (next) {
  if (this.metrics.impressions > 0) {
    this.metrics.ctr = parseFloat(((this.metrics.clicks / this.metrics.impressions) * 100).toFixed(2));
  }
  if (this.metrics.clicks > 0) {
    this.metrics.cpc = parseFloat((this.budget.spent / this.metrics.clicks).toFixed(2));
  }
  if (this.metrics.impressions > 0) {
    this.metrics.cpm = parseFloat(((this.budget.spent / this.metrics.impressions) * 1000).toFixed(2));
  }
  if (this.metrics.conversions > 0) {
    this.metrics.costPerConversion = parseFloat((this.budget.spent / this.metrics.conversions).toFixed(2));
  }
  next();
});

module.exports = mongoose.model('Campaign', campaignSchema);

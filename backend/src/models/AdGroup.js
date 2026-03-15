const mongoose = require('mongoose');

const adGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ad group name is required'],
      trim: true,
      maxlength: 200,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    budget: {
      daily: { type: Number, default: 0, min: 0 },
      spent: { type: Number, default: 0, min: 0 },
      currency: { type: String, enum: ['USD', 'INR'], default: 'USD' },
    },
    targetAudience: {
      ageMin: { type: Number, default: 18 },
      ageMax: { type: Number, default: 65 },
      genders: [{ type: String, enum: ['male', 'female', 'all'] }],
      locations: [String],
      interests: [String],
    },
    placement: {
      type: [String],
      enum: ['feed', 'sidebar', 'banner', 'search', 'stories'],
      default: ['feed'],
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'archived', 'deleted'],
      default: 'active',
    },
    metrics: {
      impressions: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      engagement: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      cpc: { type: Number, default: 0 },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

adGroupSchema.index({ campaign: 1, status: 1 });
adGroupSchema.index({ owner: 1 });

module.exports = mongoose.model('AdGroup', adGroupSchema);

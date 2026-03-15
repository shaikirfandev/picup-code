const mongoose = require('mongoose');

const adAccountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ad account name is required'],
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
    currency: {
      type: String,
      enum: ['USD', 'INR'],
      default: 'USD',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'closed'],
      default: 'active',
    },
    // Aggregate metrics
    totalSpend: { type: Number, default: 0 },
    totalBudget: { type: Number, default: 0 },
    campaignCount: { type: Number, default: 0 },
    activeCampaignCount: { type: Number, default: 0 },
    metrics: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      roi: { type: Number, default: 0 },
    },
    // Billing
    billingThreshold: { type: Number, default: 500 },
    paymentMethod: {
      type: { type: String, enum: ['card', 'bank', 'wallet'], default: 'wallet' },
      last4: String,
      brand: String,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

adAccountSchema.index({ owner: 1 });
adAccountSchema.index({ business: 1 });
adAccountSchema.index({ status: 1 });

module.exports = mongoose.model('AdAccount', adAccountSchema);

const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Ad title is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      maxlength: 500,
      default: '',
    },
    image: {
      url: String,
      publicId: String,
      fileId: String,
      width: Number,
      height: Number,
    },
    // External redirect URL for paid ads
    redirectUrl: {
      type: String,
      required: [true, 'Redirect URL is required'],
    },
    advertiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Campaign details
    campaign: {
      name: { type: String, default: '' },
      startDate: { type: Date, default: Date.now },
      endDate: Date,
      budget: { type: Number, default: 0 },
      spent: { type: Number, default: 0 },
      currency: { type: String, enum: ['USD', 'INR'], default: 'USD' },
    },
    // Placement
    placement: {
      type: String,
      enum: ['feed', 'sidebar', 'banner', 'search'],
      default: 'feed',
    },
    // Status
    status: {
      type: String,
      enum: ['draft', 'pending', 'active', 'paused', 'completed', 'rejected'],
      default: 'pending',
    },
    isPaid: { type: Boolean, default: false },
    // Payment reference
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    // Analytics
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 }, // click-through rate
    // Targeting (optional)
    targetCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    targetTags: [String],
    targetLocations: [String],
    targetAudience: {
      type: String,
      enum: ['all', 'followers', 'new_users', 'returning_users'],
      default: 'all',
    },
    // Promotion type
    promotionType: {
      type: String,
      enum: ['standard', 'featured', 'homepage', 'category_boost'],
      default: 'standard',
    },
    // Daily analytics snapshots (last 30 days)
    dailyStats: [{
      date: { type: Date, required: true },
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
      spent: { type: Number, default: 0 },
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

advertisementSchema.index({ advertiser: 1, createdAt: -1 });
advertisementSchema.index({ status: 1, placement: 1 });
advertisementSchema.index({ 'campaign.startDate': 1, 'campaign.endDate': 1 });

// Calculate CTR on save
advertisementSchema.pre('save', function (next) {
  if (this.impressions > 0) {
    this.ctr = ((this.clicks / this.impressions) * 100).toFixed(2);
  }
  next();
});

module.exports = mongoose.model('Advertisement', advertisementSchema);

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
    // Credits charged from wallet (admin-preset amount)
    creditsCost: { type: Number, default: 0 },
    // Ad validity in days (user-specified)
    validityDays: { type: Number, default: 7, min: 1, max: 365 },
    // Auto-computed expiry date
    expiresAt: { type: Date },
    // Payment reference
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    // Wallet transaction reference
    walletTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
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
advertisementSchema.index({ expiresAt: 1, status: 1 });

// Calculate CTR on save + compute expiresAt
advertisementSchema.pre('save', function (next) {
  if (this.impressions > 0) {
    this.ctr = ((this.clicks / this.impressions) * 100).toFixed(2);
  }
  // Auto-compute expiresAt when validityDays or campaign.startDate changes
  if (this.isModified('validityDays') || this.isModified('campaign.startDate') || this.isNew) {
    const start = this.campaign?.startDate || this.createdAt || new Date();
    this.expiresAt = new Date(start.getTime() + (this.validityDays || 7) * 24 * 60 * 60 * 1000);
    this.campaign.endDate = this.expiresAt;
  }
  next();
});

module.exports = mongoose.model('Advertisement', advertisementSchema);

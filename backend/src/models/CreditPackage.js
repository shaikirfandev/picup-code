const mongoose = require('mongoose');

const creditPackageSchema = new mongoose.Schema(
  {
    // Package name
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Number of credits in package
    credits: {
      type: Number,
      required: true,
      min: 1,
    },
    // Price in multiple currencies
    pricing: {
      USD: { type: Number, required: true, min: 0 },
      INR: { type: Number, required: true, min: 0 },
    },
    // Discount percentage if any
    discount: { type: Number, default: 0, min: 0, max: 100 },
    // Actual price after discount
    discountedPrice: {
      USD: Number,
      INR: Number,
    },
    // Package tier/category
    tier: {
      type: String,
      enum: ['starter', 'popular', 'pro', 'enterprise'],
      default: 'starter',
    },
    // Description
    description: String,
    // Features included in this package
    features: [String],
    // Popular flag for UI highlighting
    isPopular: { type: Boolean, default: false },
    // Active flag
    isActive: { type: Boolean, default: true },
    // Display order on store
    displayOrder: { type: Number, default: 0 },
    // Bonus credits (promotional)
    bonusCredits: { type: Number, default: 0 },
    // Validity period in days (0 = no expiry)
    validityDays: { type: Number, default: 0 },
    // Max quantity per user
    maxPerUser: Number,
    // Created/updated by admin
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
creditPackageSchema.index({ isActive: 1, displayOrder: 1 });
creditPackageSchema.index({ tier: 1 });

module.exports = mongoose.model('CreditPackage', creditPackageSchema);

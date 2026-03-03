const mongoose = require('mongoose');

const creditRuleSchema = new mongoose.Schema(
  {
    // Feature name
    feature: {
      type: String,
      enum: [
        'post_promotion',
        'advanced_analytics',
        'feature_pin',
        'ai_caption',
        'bulk_upload',
        'custom_domain',
      ],
      required: true,
      unique: true,
      index: true,
    },
    // Base cost in credits
    baseCost: {
      type: Number,
      required: true,
      min: 0,
    },
    // Description for admin panel
    description: String,
    // Whether cost varies by duration/amount
    isDynamic: { type: Boolean, default: false },
    // Dynamic cost formula if applicable
    dynamicFormula: {
      // e.g., { basePrice: 10, perDay: 5, perThousandImpressions: 0.5 }
      type: mongoose.Schema.Types.Mixed,
    },
    // Category for grouping
    category: {
      type: String,
      enum: ['promotion', 'analytics', 'ai', 'content', 'other'],
      default: 'other',
    },
    // Active flag
    isActive: { type: Boolean, default: true },
    // Min and max credits allowed
    minCredits: { type: Number, default: 1 },
    maxCredits: { type: Number, default: 100000 },
    // Metadata
    metadata: mongoose.Schema.Types.Mixed,
    // Updated by admin
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

// Index for active rules
creditRuleSchema.index({ feature: 1, isActive: 1 });

module.exports = mongoose.model('CreditRule', creditRuleSchema);

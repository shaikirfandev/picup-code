const mongoose = require('mongoose');

/**
 * CreatorRevenue — Tracks all monetization events for a creator.
 * Covers ad revenue, sponsorships, donations/tips, and subscription income.
 */
const creatorRevenueSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // — Revenue source type —
    type: {
      type: String,
      enum: ['ad_revenue', 'sponsorship', 'donation', 'tip', 'subscription', 'premium_content', 'affiliate'],
      required: true,
    },

    // — Amount —
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    netAmount: { type: Number, default: 0 },          // after platform fee
    platformFee: { type: Number, default: 0 },
    platformFeePercent: { type: Number, default: 15 }, // 15% default

    // — Status —
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'rejected', 'refunded'],
      default: 'pending',
    },

    // — Source references —
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    advertisement: { type: mongoose.Schema.Types.ObjectId, ref: 'Advertisement' },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

    // — Sponsorship specific —
    sponsorship: {
      brand: String,
      campaignName: String,
      deliverables: [String],
      startDate: Date,
      endDate: Date,
      contractUrl: String,
    },

    // — Donation/Tip specific —
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    donorMessage: { type: String, maxlength: 500 },

    // — Subscription specific —
    subscriber: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subscriptionTier: {
      type: String,
      enum: ['basic', 'premium', 'vip'],
    },

    // — Payout tracking —
    payoutId: String,
    paidAt: Date,
    payoutMethod: {
      type: String,
      enum: ['bank_transfer', 'paypal', 'stripe', 'crypto', 'manual'],
    },

    // — Period reference —
    periodStart: Date,
    periodEnd: Date,

    description: { type: String, maxlength: 500 },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

creatorRevenueSchema.index({ creator: 1, createdAt: -1 });
creatorRevenueSchema.index({ creator: 1, type: 1 });
creatorRevenueSchema.index({ creator: 1, status: 1 });
creatorRevenueSchema.index({ status: 1, type: 1 });

module.exports = mongoose.model('CreatorRevenue', creatorRevenueSchema);

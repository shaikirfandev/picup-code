const mongoose = require('mongoose');

/**
 * CreatorProfile — Extended creator/monetization settings for the professional dashboard.
 * Separates creator-specific configuration from the core User model.
 */
const creatorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // — Creator status —
    isCreator: { type: Boolean, default: false },
    creatorSince: { type: Date },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },

    // — Monetization —
    monetizationEnabled: { type: Boolean, default: false },
    monetizationEnabledAt: Date,
    monetizationTier: {
      type: String,
      enum: ['starter', 'partner', 'premium', 'elite'],
      default: 'starter',
    },

    // — Revenue settings —
    adRevenueEnabled: { type: Boolean, default: false },
    sponsorshipEnabled: { type: Boolean, default: false },
    donationsEnabled: { type: Boolean, default: false },
    tipsEnabled: { type: Boolean, default: false },
    subscriptionEnabled: { type: Boolean, default: false },
    premiumContentEnabled: { type: Boolean, default: false },
    affiliateEnabled: { type: Boolean, default: false },

    // — Payout settings —
    payoutMethod: {
      type: String,
      enum: ['bank_transfer', 'paypal', 'stripe', 'crypto'],
    },
    payoutDetails: {
      bankName: String,
      accountNumber: String,
      routingNumber: String,
      paypalEmail: String,
      stripeAccountId: String,
      cryptoWalletAddress: String,
    },
    minimumPayout: { type: Number, default: 50 },
    payoutSchedule: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly'],
      default: 'monthly',
    },

    // — Subscription tiers offered —
    subscriptionTiers: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        currency: { type: String, default: 'USD' },
        benefits: [String],
        isActive: { type: Boolean, default: true },
      },
    ],

    // — Content moderation settings —
    autoModeration: { type: Boolean, default: true },
    commentFilter: {
      enabled: { type: Boolean, default: true },
      blockedWords: [String],
      requireApproval: { type: Boolean, default: false },
      blockLinks: { type: Boolean, default: false },
    },
    spamDetection: { type: Boolean, default: true },

    // — Dashboard preferences —
    dashboardLayout: {
      type: String,
      enum: ['default', 'compact', 'detailed'],
      default: 'default',
    },
    emailReports: {
      enabled: { type: Boolean, default: true },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'weekly',
      },
    },
    notificationPreferences: {
      newFollower: { type: Boolean, default: true },
      donation: { type: Boolean, default: true },
      milestone: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: true },
      sponsorshipInquiry: { type: Boolean, default: true },
    },

    // — Goals —
    goals: {
      followerTarget: Number,
      monthlyRevenueTarget: Number,
      engagementRateTarget: Number,
      postsPerWeekTarget: Number,
    },

    // — Cumulative stats for quick access —
    lifetimeRevenue: { type: Number, default: 0 },
    lifetimePayouts: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 },
    totalSubscribers: { type: Number, default: 0 },
    totalDonationsReceived: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CreatorProfile', creatorProfileSchema);

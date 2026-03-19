const mongoose = require('mongoose');

const adClickEventSchema = new mongoose.Schema(
  {
    advertisement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Advertisement',
      required: true,
    },
    eventType: {
      type: String,
      enum: ['impression', 'click', 'view', 'conversion'],
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Fingerprint for dedup
    sessionId: { type: String, default: '' },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    // Geo & device
    country: { type: String, default: '' },
    city: { type: String, default: '' },
    deviceType: { type: String, enum: ['desktop', 'mobile', 'tablet', 'unknown'], default: 'unknown' },
    browser: { type: String, default: '' },
    os: { type: String, default: '' },
    // Referrer
    referrer: { type: String, default: '' },
    placement: { type: String, default: '' },
    // Cost tracking
    costPerClick: { type: Number, default: 0 },
    costPerImpression: { type: Number, default: 0 },
    // Fraud detection
    isSuspicious: { type: Boolean, default: false },
    suspiciousReason: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

// Indexes for analytics queries
adClickEventSchema.index({ advertisement: 1, eventType: 1, createdAt: -1 });
adClickEventSchema.index({ advertisement: 1, createdAt: -1 });
adClickEventSchema.index({ user: 1, advertisement: 1, eventType: 1 });
adClickEventSchema.index({ createdAt: -1 });
// Dedup index
adClickEventSchema.index({ advertisement: 1, sessionId: 1, eventType: 1, createdAt: 1 });
// TTL — auto-delete after 180 days
adClickEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

module.exports = mongoose.model('AdClickEvent', adClickEventSchema);

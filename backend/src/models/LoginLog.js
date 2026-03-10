const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    ip: String,
    ipMasked: String, // Privacy-compliant masked IP (e.g., 192.168.xxx.xxx)
    userAgent: String,
    method: {
      type: String,
      enum: ['email', 'google', 'github'],
      default: 'email',
    },
    success: {
      type: Boolean,
      default: true,
    },
    // Device info parsed from user-agent
    browser: String,
    os: String,
    deviceType: { type: String, enum: ['desktop', 'mobile', 'tablet', 'unknown'], default: 'unknown' },
    // Geo info from IP
    country: String,
    city: String,
    region: String,
  },
  {
    timestamps: true,
  }
);

loginLogSchema.index({ user: 1, createdAt: -1 });
loginLogSchema.index({ createdAt: -1 });
loginLogSchema.index({ email: 1 });
loginLogSchema.index({ country: 1 });
loginLogSchema.index({ success: 1, createdAt: -1 });

module.exports = mongoose.model('LoginLog', loginLogSchema);

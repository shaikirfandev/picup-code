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
  },
  {
    timestamps: true,
  }
);

loginLogSchema.index({ user: 1, createdAt: -1 });
loginLogSchema.index({ createdAt: -1 });
loginLogSchema.index({ email: 1 });

module.exports = mongoose.model('LoginLog', loginLogSchema);

const mongoose = require('mongoose');

/**
 * ScheduledPost — Posts scheduled for future publishing.
 * Processed by a background worker that publishes them at the scheduled time.
 */
const scheduledPostSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // — Reference to the draft post —
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },

    // — Schedule details —
    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },

    // — Status —
    status: {
      type: String,
      enum: ['scheduled', 'published', 'cancelled', 'failed'],
      default: 'scheduled',
    },

    // — Publishing results —
    publishedAt: Date,
    failureReason: String,
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },

    // — Optional: repeat schedule —
    recurring: { type: Boolean, default: false },
    recurrencePattern: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly'],
    },
    recurrenceEndDate: Date,

    // — Metadata —
    notes: { type: String, maxlength: 500 },
  },
  {
    timestamps: true,
  }
);

scheduledPostSchema.index({ status: 1, scheduledFor: 1 });
scheduledPostSchema.index({ creator: 1, status: 1 });

module.exports = mongoose.model('ScheduledPost', scheduledPostSchema);

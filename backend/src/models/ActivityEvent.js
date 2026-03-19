const mongoose = require('mongoose');

/**
 * ActivityEvent — Granular real-time activity log for the creator's activity feed.
 * Lightweight, TTL-managed, designed for the real-time activity feed widget.
 */
const activityEventSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // — Event classification —
    eventType: {
      type: String,
      enum: [
        'new_follower',
        'post_like',
        'post_comment',
        'post_share',
        'post_save',
        'post_view_milestone',  // 100, 500, 1000, etc.
        'profile_visit',
        'mention',
        'new_subscriber',
        'donation_received',
        'tip_received',
        'revenue_milestone',
        'content_trending',
        'achievement_unlocked',
        'sponsorship_inquiry',
        'payout_completed',
      ],
      required: true,
    },

    // — Actor (who triggered the event) —
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    actorName: String,
    actorAvatar: String,

    // — Target reference —
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    postTitle: String,
    postThumbnail: String,

    // — Event data —
    message: { type: String, maxlength: 300 },
    amount: Number,
    currency: String,
    milestone: Number,      // for milestone events
    metadata: { type: mongoose.Schema.Types.Mixed },

    // — Read state —
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// TTL: auto-delete events after 30 days
activityEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
activityEventSchema.index({ creator: 1, createdAt: -1 });
activityEventSchema.index({ creator: 1, eventType: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityEvent', activityEventSchema);

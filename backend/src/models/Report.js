const mongoose = require('mongoose');

const REPORT_REASONS = [
  'spam',
  'nsfw',
  'nudity',
  'violence',
  'harassment',
  'hate_speech',
  'abuse',
  'misinformation',
  'copyright',
  'other',
];

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
    blogPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogPost',
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: {
      type: String,
      required: true,
      enum: REPORT_REASONS,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    severity: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    autoFlagged: {
      type: Boolean,
      default: false,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    reviewNotes: String,
    actionTaken: {
      type: String,
      enum: ['none', 'removed', 'warned', 'banned', 'hidden'],
      default: 'none',
    },
  },
  { timestamps: true }
);

// Compound unique index — one pending report per user per post
reportSchema.index({ post: 1, reporter: 1 }, { unique: true, partialFilterExpression: { status: 'pending', post: { $exists: true } } });
// One pending report per user per blog post
reportSchema.index({ blogPost: 1, reporter: 1 }, { unique: true, partialFilterExpression: { status: 'pending', blogPost: { $exists: true } } });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ post: 1 });
reportSchema.index({ blogPost: 1 });
reportSchema.index({ reporter: 1 });
reportSchema.index({ reportedUser: 1 });
reportSchema.index({ priority: 1, status: 1 });

// Auto-set priority based on reason severity
reportSchema.pre('save', function (next) {
  if (this.isNew) {
    const criticalReasons = ['hate_speech', 'violence', 'nudity', 'abuse'];
    const highReasons = ['harassment', 'nsfw', 'copyright'];
    if (criticalReasons.includes(this.reason)) {
      this.priority = 'critical';
      this.severity = 8;
    } else if (highReasons.includes(this.reason)) {
      this.priority = 'high';
      this.severity = 6;
    } else if (this.reason === 'spam') {
      this.priority = 'medium';
      this.severity = 4;
    } else {
      this.priority = 'low';
      this.severity = 3;
    }
  }
  next();
});

// Static: auto-flag threshold (returns true if post should be flagged)
reportSchema.statics.AUTO_FLAG_THRESHOLD = 5;
reportSchema.statics.REPORT_REASONS = REPORT_REASONS;

module.exports = mongoose.model('Report', reportSchema);

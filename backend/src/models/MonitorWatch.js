const mongoose = require('mongoose');

/**
 * MonitorWatch — mirrors the real Parallel.ai Monitor API.
 * Watches URLs for changes and sends notifications.
 */

const changeEventSchema = new mongoose.Schema({
  detected_at: { type: Date, default: Date.now },
  change_type: {
    type: String,
    enum: ['content_changed', 'new_page', 'page_removed', 'metadata_changed'],
  },
  summary:     { type: String },
  diff_excerpt: { type: String },
  old_hash:    { type: String },
  new_hash:    { type: String },
}, { _id: true });

const monitorWatchSchema = new mongoose.Schema({
  watch_id: {
    type: String,
    required: true,
    index: true,
    default: () => `mon_${new mongoose.Types.ObjectId().toHexString()}`,
  },

  /* ── config ────────────────────────────────────────── */
  url:         { type: String, required: true },
  name:        { type: String },
  objective:   { type: String },   // what to watch for
  frequency: {
    type: String,
    enum: ['5min', '15min', '30min', 'hourly', 'daily', 'weekly'],
    default: 'daily',
  },
  notify_on: [{
    type: String,
    enum: ['content_changed', 'new_page', 'page_removed', 'metadata_changed'],
  }],

  /* ── state ─────────────────────────────────────────── */
  is_active:     { type: Boolean, default: true },
  last_checked:  { type: Date },
  next_check:    { type: Date },
  last_hash:     { type: String },
  last_content:  { type: String },
  changes:       [changeEventSchema],
  total_checks:  { type: Number, default: 0 },
  total_changes: { type: Number, default: 0 },

  /* ── ownership ─────────────────────────────────────── */
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

monitorWatchSchema.index({ watch_id: 1 }, { unique: true });
monitorWatchSchema.index({ user: 1, is_active: 1 });
monitorWatchSchema.index({ next_check: 1, is_active: 1 });

module.exports = mongoose.model('MonitorWatch', monitorWatchSchema);

const mongoose = require('mongoose');

/**
 * Source — a registered origin (website, API, uploaded file) that can be
 * crawled / ingested.  Every Chunk traces back to exactly one Source.
 */
const sourceSchema = new mongoose.Schema(
  {
    /* ── identity ────────────────────────────────────── */
    name:        { type: String, required: true, trim: true },
    url:         { type: String, required: true, index: true },
    domain:      { type: String, index: true },            // auto-extracted
    type: {
      type: String,
      enum: ['webpage', 'api', 'pdf', 'doc', 'html', 'rss', 'sitemap', 'upload'],
      default: 'webpage',
    },

    /* ── trust / scoring ─────────────────────────────── */
    trustScore: { type: Number, default: 0.5, min: 0, max: 1 },   // 0–1
    qualityScore: { type: Number, default: 0.5, min: 0, max: 1 },
    isVerified: { type: Boolean, default: false },
    isBanned:   { type: Boolean, default: false },

    /* ── crawl config ────────────────────────────────── */
    crawlFrequency: {
      type: String,
      enum: ['once', 'hourly', 'daily', 'weekly', 'monthly'],
      default: 'daily',
    },
    crawlDepth:    { type: Number, default: 1, min: 0, max: 5 },
    lastCrawledAt: { type: Date },
    nextCrawlAt:   { type: Date },
    crawlStatus: {
      type: String,
      enum: ['pending', 'crawling', 'completed', 'failed', 'paused'],
      default: 'pending',
    },
    crawlError:    { type: String },

    /* ── stats ───────────────────────────────────────── */
    chunksCount:   { type: Number, default: 0 },
    pagesCount:    { type: Number, default: 0 },
    totalBytes:    { type: Number, default: 0 },
    avgChunkScore: { type: Number, default: 0 },

    /* ── metadata ────────────────────────────────────── */
    tags:        [{ type: String, lowercase: true, trim: true }],
    description: { type: String, maxlength: 2000 },
    favicon:     { type: String },
    language:    { type: String, default: 'en' },

    /* ── ownership ───────────────────────────────────── */
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

sourceSchema.index({ domain: 1, crawlStatus: 1 });
sourceSchema.index({ nextCrawlAt: 1, crawlStatus: 1 });
sourceSchema.index({ trustScore: -1 });
sourceSchema.index({ name: 'text', url: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Source', sourceSchema);

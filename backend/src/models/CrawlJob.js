const mongoose = require('mongoose');

/**
 * CrawlJob — a unit of work in the crawl → clean → chunk → embed → index pipeline.
 * One Source can trigger many CrawlJobs over time.
 */
const crawlJobSchema = new mongoose.Schema(
  {
    source:   { type: mongoose.Schema.Types.ObjectId, ref: 'Source', required: true, index: true },
    url:      { type: String, required: true },
    depth:    { type: Number, default: 0 },

    /* pipeline stage tracking */
    stage: {
      type: String,
      enum: ['queued', 'crawling', 'cleaning', 'chunking', 'embedding', 'indexing', 'completed', 'failed'],
      default: 'queued',
      index: true,
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },

    /* stage results */
    rawContent:     { type: String },                    // full HTML / raw text
    cleanedContent: { type: String },                    // after boilerplate removal
    rawBytes:       { type: Number, default: 0 },
    cleanedBytes:   { type: Number, default: 0 },
    chunksCreated:  { type: Number, default: 0 },
    pagesDiscovered: [{ type: String }],                 // child URLs found during crawl

    /* metadata extracted */
    pageTitle:    { type: String },
    pageAuthor:   { type: String },
    publishedAt:  { type: Date },
    contentType:  { type: String },                      // text/html, application/pdf, etc.
    language:     { type: String, default: 'en' },
    statusCode:   { type: Number },

    /* timing */
    startedAt:   { type: Date },
    completedAt: { type: Date },
    duration:    { type: Number },                       // ms

    /* errors */
    error:       { type: String },
    retryCount:  { type: Number, default: 0 },
    maxRetries:  { type: Number, default: 3 },

    /* ownership */
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

crawlJobSchema.index({ stage: 1, createdAt: 1 });
crawlJobSchema.index({ source: 1, stage: 1 });

module.exports = mongoose.model('CrawlJob', crawlJobSchema);

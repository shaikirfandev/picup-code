const mongoose = require('mongoose');

/**
 * Chunk — a cleaned, embedded text fragment produced by the ingest pipeline.
 * This is the atomic unit of retrieval.
 */
const chunkSchema = new mongoose.Schema(
  {
    /* ── content ─────────────────────────────────────── */
    content:  { type: String, required: true },               // cleaned text
    contentHash: { type: String },                              // sha-256 for dedup
    charCount: { type: Number },
    wordCount: { type: Number },

    /* ── source traceability ─────────────────────────── */
    source:    { type: mongoose.Schema.Types.ObjectId, ref: 'Source', required: true, index: true },
    sourceUrl: { type: String, required: true },               // exact page URL
    pageTitle: { type: String },
    section:   { type: String },                               // heading / section name
    position:  { type: Number, default: 0 },                   // order within page

    /* ── citation ────────────────────────────────────── */
    citation: {
      title:     String,
      url:       String,
      domain:    String,
      publishedAt: Date,
      author:    String,
      snippet:   String,                                        // first ~200 chars
    },

    /* ── embedding (stored inline – works with Mongo Atlas Vector Search
          or can be synced to Qdrant/Milvus externally) ───── */
    embedding: { type: [Number], default: [] },                // 1536-d / 768-d float array
    embeddingModel: { type: String, default: 'text-embedding-3-small' },
    embeddingDim:   { type: Number, default: 1536 },

    /* ── scoring / quality ───────────────────────────── */
    relevanceScore:  { type: Number, default: 0 },             // set at query-time (transient)
    confidenceScore: { type: Number, default: 0.5, min: 0, max: 1 },
    trustScore:      { type: Number, default: 0.5, min: 0, max: 1 }, // inherited from source
    qualityScore:    { type: Number, default: 0.5, min: 0, max: 1 },

    /* ── structured data (optional) ──────────────────── */
    structuredData:  { type: mongoose.Schema.Types.Mixed },    // JSON extracted by LLM
    dataSchema:      { type: String },                         // schema name / key

    /* ── metadata ────────────────────────────────────── */
    language:    { type: String, default: 'en' },
    contentType: { type: String, default: 'text' },            // text, table, code, image-caption
    tags:        [{ type: String, lowercase: true, trim: true }],
    category:    { type: String },

    /* ── pipeline tracking ───────────────────────────── */
    status: {
      type: String,
      enum: ['raw', 'cleaned', 'chunked', 'embedded', 'indexed', 'failed'],
      default: 'raw',
      index: true,
    },
    processingError: { type: String },
    processedAt:     { type: Date },
  },
  { timestamps: true }
);

/* ── Indexes ──────────────────────────────────────────── */
chunkSchema.index({ content: 'text', pageTitle: 'text', tags: 'text' });
chunkSchema.index({ source: 1, position: 1 });
chunkSchema.index({ contentHash: 1 }, { unique: true, sparse: true });
chunkSchema.index({ status: 1, createdAt: -1 });
chunkSchema.index({ 'citation.domain': 1 });
chunkSchema.index({ trustScore: -1, confidenceScore: -1 });

module.exports = mongoose.model('Chunk', chunkSchema);

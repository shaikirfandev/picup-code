const mongoose = require('mongoose');

/**
 * TaskRun — mirrors the real Parallel.ai Task API.
 * Handles deep research with processors (base, pro, ultra),
 * structured/text outputs, citations, confidence, SSE events.
 */

const citationSchema = new mongoose.Schema({
  url:       { type: String, required: true },
  title:     { type: String },
  excerpts:  [{ type: String }],
  domain:    { type: String },
}, { _id: false });

const fieldBasisSchema = new mongoose.Schema({
  field:      { type: String, required: true },
  reasoning:  { type: String, required: true },
  citations:  [citationSchema],
  confidence: { type: String },
}, { _id: false });

const progressEventSchema = new mongoose.Schema({
  type:      { type: String, required: true },  // task_run.progress_msg.plan, .search, .result, .tool_call
  message:   { type: String },
  timestamp: { type: Date, default: Date.now },
  data:      { type: mongoose.Schema.Types.Mixed },
}, { _id: true });

const taskRunSchema = new mongoose.Schema({
  /* ── identity ──────────────────────────────────────── */
  run_id: {
    type: String,
    required: true,
    index: true,
    default: () => `run_${new mongoose.Types.ObjectId().toHexString()}`,
  },

  /* ── input ─────────────────────────────────────────── */
  input:     { type: String, required: true },
  processor: {
    type: String,
    enum: ['base', 'pro', 'ultra'],
    default: 'base',
  },
  output_schema: { type: mongoose.Schema.Types.Mixed },   // JSON schema or { type: 'auto' }
  task_spec: {
    input_schema:  { type: mongoose.Schema.Types.Mixed },
    output_schema: { type: mongoose.Schema.Types.Mixed },
    instructions:  { type: String },
  },
  source_policy: {
    after_date:       { type: String },
    exclude_domains:  [{ type: String }],
    include_domains:  [{ type: String }],
  },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed },

  /* ── execution ─────────────────────────────────────── */
  status: {
    type: String,
    enum: ['queued', 'running', 'completed', 'failed', 'cancelled'],
    default: 'queued',
  },
  enable_events: { type: Boolean, default: false },
  events: [progressEventSchema],

  /* ── output ────────────────────────────────────────── */
  output: {
    type: {
      type: String,
      enum: ['text', 'json'],
    },
    content:         { type: String },
    structured_data: { type: mongoose.Schema.Types.Mixed },
  },
  citations: [citationSchema],
  basis:     [fieldBasisSchema],
  confidence: { type: Number, min: 0, max: 1 },
  reasoning:  { type: String },
  warnings:   [{ type: String, message: String }],

  /* ── performance ───────────────────────────────────── */
  sources_considered: { type: Number, default: 0 },
  sources_read:       { type: Number, default: 0 },
  sources_read_sample: [{ type: String }],
  usage: [{
    name:  { type: String },
    count: { type: Number },
  }],

  started_at:   { type: Date },
  completed_at: { type: Date },
  duration_ms:  { type: Number },

  /* ── ownership ─────────────────────────────────────── */
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

taskRunSchema.index({ run_id: 1 }, { unique: true });
taskRunSchema.index({ user: 1, createdAt: -1 });
taskRunSchema.index({ status: 1 });

module.exports = mongoose.model('TaskRun', taskRunSchema);

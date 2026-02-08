const mongoose = require('mongoose');

/**
 * ResearchTask — a multi-step agent task (POST /task or POST /findall).
 * The agent decomposes the goal, runs searches, extracts data, verifies,
 * and produces a final structured + cited output.
 */
const stepSchema = new mongoose.Schema(
  {
    stepNumber: { type: Number, required: true },
    action:     { type: String, required: true },      // search, extract, verify, summarize
    input:      { type: mongoose.Schema.Types.Mixed },
    output:     { type: mongoose.Schema.Types.Mixed },
    sourcesUsed: [{ url: String, title: String, trustScore: Number }],
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'skipped'],
      default: 'pending',
    },
    error:     { type: String },
    startedAt: { type: Date },
    endedAt:   { type: Date },
    duration:  { type: Number },
    tokensUsed: { type: Number, default: 0 },
  },
  { _id: true }
);

const researchTaskSchema = new mongoose.Schema(
  {
    /* ── identity ────────────────────────────────────── */
    taskType: {
      type: String,
      enum: ['search', 'extract', 'task', 'findall'],
      required: true,
      index: true,
    },

    /* ── input ───────────────────────────────────────── */
    goal:         { type: String, required: true },       // natural-language goal
    query:        { type: String },                       // search query if applicable
    url:          { type: String },                       // extract target URL
    outputSchema: { type: mongoose.Schema.Types.Mixed },  // desired JSON shape
    filters:      { type: mongoose.Schema.Types.Mixed },  // domain/date/type filters
    criteria:     { type: mongoose.Schema.Types.Mixed },  // findall criteria
    maxResults:   { type: Number, default: 20 },

    /* ── execution ───────────────────────────────────── */
    status: {
      type: String,
      enum: ['queued', 'planning', 'executing', 'verifying', 'completed', 'failed', 'cancelled'],
      default: 'queued',
      index: true,
    },
    plan:  { type: [String] },                            // list of planned sub-steps
    steps: [stepSchema],

    /* ── output ──────────────────────────────────────── */
    result: {
      data:       { type: mongoose.Schema.Types.Mixed },  // final structured result
      summary:    { type: String },                        // natural-language summary
      confidence: { type: Number, min: 0, max: 1 },
      citations:  [{
        title:      String,
        url:        String,
        domain:     String,
        trustScore: Number,
        snippet:    String,
        accessedAt: Date,
      }],
      chunks:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chunk' }],
    },

    /* ── performance ─────────────────────────────────── */
    totalTokensUsed: { type: Number, default: 0 },
    totalCost:       { type: Number, default: 0 },           // $ estimate
    startedAt:       { type: Date },
    completedAt:     { type: Date },
    duration:        { type: Number },                       // ms

    /* ── metadata ────────────────────────────────────── */
    error:  { type: String },
    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    model:  { type: String, default: 'gpt-4o-mini' },
  },
  { timestamps: true }
);

researchTaskSchema.index({ user: 1, createdAt: -1 });
researchTaskSchema.index({ status: 1, taskType: 1 });

module.exports = mongoose.model('ResearchTask', researchTaskSchema);

const mongoose = require('mongoose');

/**
 * FindAllRun — mirrors the real Parallel.ai FindAll API.
 * Discovers entities matching natural-language criteria with match conditions.
 */

const matchConditionSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, required: true },
}, { _id: false });

const candidateSchema = new mongoose.Schema({
  candidate_id: { type: String, required: true },
  name:         { type: String, required: true },
  url:          { type: String, required: true },
  description:  { type: String },
  match_status: {
    type: String,
    enum: ['generated', 'matched', 'unmatched', 'discarded'],
    default: 'generated',
  },
  output: { type: mongoose.Schema.Types.Mixed },
  basis:  [{ type: mongoose.Schema.Types.Mixed }],
}, { _id: true });

const findAllRunSchema = new mongoose.Schema({
  /* ── identity ──────────────────────────────────────── */
  findall_id: {
    type: String,
    required: true,
    index: true,
    default: () => `findall_${new mongoose.Types.ObjectId().toHexString()}`,
  },

  /* ── input ─────────────────────────────────────────── */
  entity_type: { type: String, required: true },
  objective:   { type: String, required: true },
  generator: {
    type: String,
    enum: ['base', 'core', 'pro', 'preview'],
    default: 'base',
  },
  match_conditions: [matchConditionSchema],
  match_limit:      { type: Number, default: 10 },
  exclude_list: [{
    name: { type: String },
    url:  { type: String },
  }],
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed },

  /* ── execution ─────────────────────────────────────── */
  status: {
    is_active: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['queued', 'action_required', 'running', 'completed', 'failed', 'cancelling', 'cancelled'],
      default: 'queued',
    },
    metrics: {
      candidates_generated: { type: Number, default: 0 },
      candidates_matched:   { type: Number, default: 0 },
      candidates_unmatched: { type: Number, default: 0 },
      candidates_discarded: { type: Number, default: 0 },
    },
    termination_reason: {
      type: String,
      enum: ['low_match_rate', 'match_limit_met', 'candidates_exhausted', 'user_cancelled', 'error_occurred', 'timeout', null],
      default: null,
    },
  },

  /* ── results ───────────────────────────────────────── */
  candidates: [candidateSchema],
  enrichments: [{ type: mongoose.Schema.Types.Mixed }],
  schema_snapshot: { type: mongoose.Schema.Types.Mixed },

  /* ── ownership ─────────────────────────────────────── */
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

findAllRunSchema.index({ findall_id: 1 }, { unique: true });
findAllRunSchema.index({ user: 1, createdAt: -1 });
findAllRunSchema.index({ 'status.status': 1 });

module.exports = mongoose.model('FindAllRun', findAllRunSchema);

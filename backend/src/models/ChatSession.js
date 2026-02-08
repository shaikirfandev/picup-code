const mongoose = require('mongoose');

/**
 * ChatSession — mirrors the real Parallel.ai Chat API.
 * Chat completions with web-grounded search.
 */

const chatMessageSchema = new mongoose.Schema({
  role:    { type: String, enum: ['system', 'user', 'assistant'], required: true },
  content: { type: String, required: true },
  citations: [{
    url:      { type: String },
    title:    { type: String },
    excerpts: [{ type: String }],
  }],
  search_queries: [{ type: String }],
  created_at: { type: Date, default: Date.now },
}, { _id: true });

const chatSessionSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    index: true,
    default: () => `chat_${new mongoose.Types.ObjectId().toHexString()}`,
  },
  messages: [chatMessageSchema],
  model:    { type: String, default: 'parallel-chat-base' },
  web_search_enabled: { type: Boolean, default: true },
  source_policy: {
    after_date:       { type: String },
    exclude_domains:  [{ type: String }],
    include_domains:  [{ type: String }],
  },
  usage: [{
    name:  { type: String },
    count: { type: Number },
  }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

chatSessionSchema.index({ session_id: 1 }, { unique: true });
chatSessionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);

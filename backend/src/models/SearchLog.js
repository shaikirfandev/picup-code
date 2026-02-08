const mongoose = require('mongoose');

/**
 * SearchLog — every search query + results for analytics, caching, and
 * feedback loops.
 */
const searchLogSchema = new mongoose.Schema(
  {
    query:     { type: String, required: true, index: true },
    filters:   { type: mongoose.Schema.Types.Mixed },
    resultCount: { type: Number, default: 0 },
    topResults: [{
      chunkId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Chunk' },
      score:      Number,
      sourceUrl:  String,
      title:      String,
    }],
    searchType:  { type: String, enum: ['keyword', 'semantic', 'hybrid'], default: 'hybrid' },
    responseTime: { type: Number },                     // ms
    cached:      { type: Boolean, default: false },
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ip:          { type: String },
  },
  { timestamps: true }
);

searchLogSchema.index({ query: 1, createdAt: -1 });
searchLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('SearchLog', searchLogSchema);

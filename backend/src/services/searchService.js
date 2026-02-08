/**
 * SearchService — hybrid search engine combining keyword (MongoDB text)
 * and semantic (vector cosine) search with re-ranking.
 *
 * Flow:
 *  1. Keyword search via MongoDB $text index → score A
 *  2. Semantic search via embedding + cosine similarity → score B
 *  3. Reciprocal Rank Fusion (RRF) to merge rankings
 *  4. Optional LLM cross-encoder re-rank (if enabled)
 *  5. Source trust weighting
 *  6. Return sorted chunks with confidence + citations
 */

const Chunk = require('../models/Chunk');
const SearchLog = require('../models/SearchLog');
const { embed, cosineSimilarity } = require('./embeddingService');

const KEYWORD_WEIGHT = 0.35;
const SEMANTIC_WEIGHT = 0.45;
const TRUST_WEIGHT = 0.20;
const RRF_K = 60; // Reciprocal Rank Fusion constant

/* ── Keyword search (MongoDB $text) ─────────────────── */
async function keywordSearch(query, filters = {}, limit = 50) {
  const filter = { status: 'indexed' };
  if (query) filter.$text = { $search: query };
  if (filters.domain) filter['citation.domain'] = filters.domain;
  if (filters.language) filter.language = filters.language;
  if (filters.category) filter.category = filters.category;
  if (filters.tags && filters.tags.length > 0) filter.tags = { $in: filters.tags };
  if (filters.sourceId) filter.source = filters.sourceId;

  const projection = query ? { score: { $meta: 'textScore' } } : {};
  const sort = query ? { score: { $meta: 'textScore' } } : { createdAt: -1 };

  const results = await Chunk.find(filter, projection)
    .sort(sort)
    .limit(limit)
    .populate('source', 'name url domain trustScore favicon')
    .lean();

  return results.map((r, i) => ({
    ...r,
    keywordScore: r.score || 0,
    keywordRank: i + 1,
  }));
}

/* ── Semantic (vector) search ───────────────────────── */
async function semanticSearch(query, filters = {}, limit = 50) {
  // Generate query embedding
  const queryVec = await embed(query);

  // Fetch candidate chunks that have embeddings
  const filter = { status: 'indexed', 'embedding.0': { $exists: true } };
  if (filters.domain) filter['citation.domain'] = filters.domain;
  if (filters.language) filter.language = filters.language;
  if (filters.category) filter.category = filters.category;
  if (filters.tags && filters.tags.length > 0) filter.tags = { $in: filters.tags };
  if (filters.sourceId) filter.source = filters.sourceId;

  // In production, use Qdrant/Milvus/Atlas Vector Search.
  // For now, fetch top N by trust and compute in-memory.
  const candidates = await Chunk.find(filter)
    .sort({ trustScore: -1 })
    .limit(500)
    .populate('source', 'name url domain trustScore favicon')
    .lean();

  // Compute cosine similarities
  const scored = candidates.map((chunk) => ({
    ...chunk,
    semanticScore: chunk.embedding && chunk.embedding.length > 0
      ? cosineSimilarity(queryVec, chunk.embedding)
      : 0,
  }));

  // Sort by semantic score desc and take top results
  scored.sort((a, b) => b.semanticScore - a.semanticScore);
  return scored.slice(0, limit).map((r, i) => ({
    ...r,
    semanticRank: i + 1,
  }));
}

/* ── Reciprocal Rank Fusion (RRF) ───────────────────── */
function reciprocalRankFusion(keywordResults, semanticResults) {
  const scoreMap = new Map();

  // Score from keyword results
  for (const r of keywordResults) {
    const id = r._id.toString();
    const rrfScore = 1 / (RRF_K + r.keywordRank);
    scoreMap.set(id, {
      chunk: r,
      keywordScore: r.keywordScore || 0,
      keywordRRF: rrfScore,
      semanticScore: 0,
      semanticRRF: 0,
      trustScore: r.trustScore || 0.5,
    });
  }

  // Score from semantic results
  for (const r of semanticResults) {
    const id = r._id.toString();
    const rrfScore = 1 / (RRF_K + r.semanticRank);

    if (scoreMap.has(id)) {
      const existing = scoreMap.get(id);
      existing.semanticScore = r.semanticScore;
      existing.semanticRRF = rrfScore;
    } else {
      scoreMap.set(id, {
        chunk: r,
        keywordScore: 0,
        keywordRRF: 0,
        semanticScore: r.semanticScore,
        semanticRRF: rrfScore,
        trustScore: r.trustScore || 0.5,
      });
    }
  }

  // Compute final fused score
  const fused = [];
  for (const [id, entry] of scoreMap) {
    const finalScore =
      KEYWORD_WEIGHT * entry.keywordRRF +
      SEMANTIC_WEIGHT * entry.semanticRRF +
      TRUST_WEIGHT * (entry.trustScore / (RRF_K + 1));

    const confidence = Math.min(1, Math.max(0,
      (entry.keywordRRF > 0 && entry.semanticRRF > 0 ? 0.80 : 0.45) +
      (entry.keywordScore > 2 ? 0.10 : 0) +
      (entry.semanticScore > 0.5 ? 0.08 : 0) +
      entry.trustScore * 0.12
    ));

    fused.push({
      ...entry.chunk,
      relevanceScore: finalScore,
      confidenceScore: confidence,
      _keywordScore: entry.keywordScore,
      _semanticScore: entry.semanticScore,
      _trustScore: entry.trustScore,
    });
  }

  // Sort by fused score descending
  fused.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return fused;
}

/* ── Deduplication by content similarity ────────────── */
function deduplicateResults(results, threshold = 0.92) {
  const seen = [];
  const deduped = [];

  for (const r of results) {
    const isDupe = seen.some((s) => {
      if (r.contentHash && s.contentHash && r.contentHash === s.contentHash) return true;
      // Rough text similarity check
      const shorter = Math.min(r.content.length, s.content.length);
      const longer = Math.max(r.content.length, s.content.length);
      if (shorter / longer < 0.7) return false;
      // Compare first 200 chars
      const a = r.content.substring(0, 200).toLowerCase();
      const b = s.content.substring(0, 200).toLowerCase();
      let matches = 0;
      for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (a[i] === b[i]) matches++;
      }
      return matches / Math.max(a.length, b.length) > threshold;
    });

    if (!isDupe) {
      seen.push(r);
      deduped.push(r);
    }
  }

  return deduped;
}

/* ────────────────────────────────────────────────────── */
/*  PUBLIC: Hybrid Search                                  */
/* ────────────────────────────────────────────────────── */
async function hybridSearch(query, options = {}) {
  const {
    filters = {},
    limit = 20,
    page = 1,
    searchType = 'hybrid',
    userId = null,
    ip = null,
    deduplicate = true,
  } = options;

  const startTime = Date.now();

  let results;

  if (searchType === 'keyword') {
    const kwResults = await keywordSearch(query, filters, limit * 3);
    results = kwResults;
  } else if (searchType === 'semantic') {
    const semResults = await semanticSearch(query, filters, limit * 3);
    results = semResults;
  } else {
    // Hybrid: run both in parallel, then fuse
    const [kwResults, semResults] = await Promise.all([
      keywordSearch(query, filters, limit * 2),
      semanticSearch(query, filters, limit * 2),
    ]);
    results = reciprocalRankFusion(kwResults, semResults);
  }

  // Filter out irrelevant results — require minimum keyword match or semantic score
  results = results.filter((r) => {
    const kw = r.keywordScore || r._keywordScore || 0;
    const sem = r.semanticScore || r._semanticScore || 0;
    // In keyword mode, need non-zero text score; in semantic mode, need decent cosine;
    // in hybrid, need at least one signal
    if (searchType === 'keyword') return kw > 0.3;
    if (searchType === 'semantic') return sem > 0.15;
    return kw > 0.1 || sem > 0.15;
  });

  // Deduplicate
  if (deduplicate) {
    results = deduplicateResults(results);
  }

  // Paginate
  const total = results.length;
  const start = (page - 1) * limit;
  const paged = results.slice(start, start + limit);

  const responseTime = Date.now() - startTime;

  // Log the search
  try {
    await SearchLog.create({
      query,
      filters,
      resultCount: total,
      topResults: paged.slice(0, 5).map((r) => ({
        chunkId: r._id,
        score: r.relevanceScore,
        sourceUrl: r.sourceUrl || r.citation?.url,
        title: r.pageTitle || r.citation?.title,
      })),
      searchType,
      responseTime,
      user: userId,
      ip,
    });
  } catch { /* non-critical */ }

  // Format for API response
  const formattedResults = paged.map((r) => ({
    id: r._id,
    content: r.content,
    title: r.pageTitle || r.citation?.title || '',
    snippet: r.citation?.snippet || r.content.substring(0, 250),
    relevanceScore: Math.round((r.relevanceScore || 0) * 10000) / 10000,
    confidenceScore: Math.round((r.confidenceScore || 0.5) * 100) / 100,
    trustScore: Math.round((r._trustScore || r.trustScore || 0.5) * 100) / 100,
    source: {
      id: r.source?._id || r.source,
      name: r.source?.name || r.citation?.domain || '',
      url: r.sourceUrl || r.citation?.url || '',
      domain: r.source?.domain || r.citation?.domain || '',
      favicon: r.source?.favicon || '',
    },
    citation: r.citation || {},
    tags: r.tags || [],
    category: r.category || '',
    contentType: r.contentType || 'text',
    language: r.language || 'en',
    wordCount: r.wordCount || 0,
    createdAt: r.createdAt,
  }));

  return {
    results: formattedResults,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: start + limit < total,
    },
    meta: {
      query,
      searchType,
      responseTime,
      filters,
    },
  };
}

module.exports = {
  hybridSearch,
  keywordSearch,
  semanticSearch,
  reciprocalRankFusion,
  deduplicateResults,
};

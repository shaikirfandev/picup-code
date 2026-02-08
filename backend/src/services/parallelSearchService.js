/**
 * parallelSearchService.js — mirrors the real Parallel.ai Search API.
 *
 * POST /v1beta/search
 *
 * Input:  { objective, search_queries, max_results, excerpts, processor, mode, source_policy }
 * Output: { results: WebSearchResult[], search_id, usage, warnings }
 *
 * Uses our local hybrid search engine but reshapes I/O to match
 * the real Parallel.ai SearchResult / WebSearchResult schema.
 */

const Chunk = require('../models/Chunk');
const SearchLog = require('../models/SearchLog');
const { embed, cosineSimilarity } = require('./embeddingService');
const crypto = require('crypto');

/* ── Constants ───────────────────────────────────────── */
const KEYWORD_WEIGHT  = 0.35;
const SEMANTIC_WEIGHT = 0.45;
const TRUST_WEIGHT    = 0.20;
const RRF_K           = 60;

/* ── Generate search ID ─────────────────────────────── */
function generateSearchId() {
  return `search_${crypto.randomBytes(16).toString('hex')}`;
}

/* ── Build MongoDB filter from source_policy ────────── */
function buildFilter(sourcePolicy = {}) {
  const filter = { status: 'indexed' };
  if (sourcePolicy.include_domains?.length > 0) {
    filter['citation.domain'] = { $in: sourcePolicy.include_domains };
  }
  if (sourcePolicy.exclude_domains?.length > 0) {
    filter['citation.domain'] = {
      ...filter['citation.domain'],
      $nin: sourcePolicy.exclude_domains,
    };
  }
  if (sourcePolicy.after_date) {
    filter['citation.publishedAt'] = { $gte: new Date(sourcePolicy.after_date) };
  }
  return filter;
}

/* ── Keyword search ──────────────────────────────────── */
async function keywordSearch(queries, filter, limit) {
  const searchText = queries.join(' ');
  const textFilter = { ...filter };
  if (searchText) textFilter.$text = { $search: searchText };

  const projection = searchText ? { score: { $meta: 'textScore' } } : {};
  const sort = searchText ? { score: { $meta: 'textScore' } } : { createdAt: -1 };

  const results = await Chunk.find(textFilter, projection)
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

/* ── Semantic search ─────────────────────────────────── */
async function semanticSearch(queries, filter, limit) {
  const combinedQuery = queries.join('. ');
  const queryVec = await embed(combinedQuery);

  const semFilter = { ...filter, 'embedding.0': { $exists: true } };
  const candidates = await Chunk.find(semFilter)
    .sort({ trustScore: -1 })
    .limit(500)
    .populate('source', 'name url domain trustScore favicon')
    .lean();

  const scored = candidates.map((chunk) => ({
    ...chunk,
    semanticScore: chunk.embedding?.length > 0
      ? cosineSimilarity(queryVec, chunk.embedding) : 0,
  }));

  scored.sort((a, b) => b.semanticScore - a.semanticScore);
  return scored.slice(0, limit).map((r, i) => ({
    ...r,
    semanticRank: i + 1,
  }));
}

/* ── RRF Fusion ──────────────────────────────────────── */
function fusionRank(kwResults, semResults) {
  const map = new Map();

  for (const r of kwResults) {
    const id = r._id.toString();
    map.set(id, {
      chunk: r,
      kwScore: r.keywordScore || 0,
      kwRRF: 1 / (RRF_K + r.keywordRank),
      semScore: 0,
      semRRF: 0,
      trust: r.trustScore || 0.5,
    });
  }

  for (const r of semResults) {
    const id = r._id.toString();
    const rrfScore = 1 / (RRF_K + r.semanticRank);
    if (map.has(id)) {
      const e = map.get(id);
      e.semScore = r.semanticScore;
      e.semRRF = rrfScore;
    } else {
      map.set(id, {
        chunk: r,
        kwScore: 0,
        kwRRF: 0,
        semScore: r.semanticScore,
        semRRF: rrfScore,
        trust: r.trustScore || 0.5,
      });
    }
  }

  const fused = [];
  for (const [, entry] of map) {
    const finalScore =
      KEYWORD_WEIGHT  * entry.kwRRF +
      SEMANTIC_WEIGHT * entry.semRRF +
      TRUST_WEIGHT    * (entry.trust / (RRF_K + 1));

    fused.push({ ...entry.chunk, _finalScore: finalScore, _trust: entry.trust });
  }

  fused.sort((a, b) => b._finalScore - a._finalScore);
  return fused;
}

/* ── Dedup ───────────────────────────────────────────── */
function deduplicate(results) {
  const seen = new Set();
  return results.filter((r) => {
    if (r.contentHash && seen.has(r.contentHash)) return false;
    if (r.contentHash) seen.add(r.contentHash);
    // Also dedupe by URL
    const key = r.sourceUrl || r.citation?.url;
    if (key && seen.has(key)) return false;
    if (key) seen.add(key);
    return true;
  });
}

/* ── Generate excerpts from chunk content ────────────── */
function generateExcerpts(content, maxCharsPerResult = 1500, maxCharsTotal = null) {
  if (!content) return [];

  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 30);
  const excerpts = [];
  let totalChars = 0;

  for (const p of paragraphs) {
    const trimmed = p.trim().substring(0, maxCharsPerResult);
    if (maxCharsTotal && totalChars + trimmed.length > maxCharsTotal) break;
    excerpts.push(trimmed);
    totalChars += trimmed.length;
    if (excerpts.length >= 5) break; // Max 5 excerpts per result
  }

  if (excerpts.length === 0 && content.length > 0) {
    excerpts.push(content.substring(0, Math.min(maxCharsPerResult, 500)));
  }

  return excerpts;
}

/* ════════════════════════════════════════════════════════
   PUBLIC: search()  — matches Parallel.ai POST /v1beta/search
   ════════════════════════════════════════════════════════ */
async function search(params = {}) {
  const {
    objective = null,
    search_queries = null,
    max_results = 10,
    excerpts = {},
    processor = 'base',
    mode = 'one-shot',
    source_policy = {},
    userId = null,
    ip = null,
  } = params;

  if (!objective && (!search_queries || search_queries.length === 0)) {
    throw new Error('At least one of objective or search_queries must be provided');
  }

  const startTime = Date.now();
  const searchId = generateSearchId();

  // Build queries array
  const queries = [];
  if (objective) queries.push(objective);
  if (search_queries) queries.push(...search_queries);

  // Build filter from source policy
  const filter = buildFilter(source_policy);

  // Excerpt settings
  const maxCharsPerResult = excerpts.max_chars_per_result || (mode === 'one-shot' ? 2000 : 800);
  const maxCharsTotal     = excerpts.max_chars_total || (mode === 'one-shot' ? 50000 : 20000);

  // Search strategy based on processor
  let rawResults;
  const internalLimit = Math.min(max_results * 4, 200);

  if (processor === 'base') {
    // Base: fast keyword-first hybrid
    const [kw, sem] = await Promise.all([
      keywordSearch(queries, filter, internalLimit),
      semanticSearch(queries, filter, Math.floor(internalLimit / 2)),
    ]);
    rawResults = fusionRank(kw, sem);
  } else {
    // Pro: deeper semantic search with more candidates
    const [kw, sem] = await Promise.all([
      keywordSearch(queries, filter, internalLimit),
      semanticSearch(queries, filter, internalLimit),
    ]);
    rawResults = fusionRank(kw, sem);
  }

  // Filter irrelevant
  rawResults = rawResults.filter((r) => {
    const kw = r.keywordScore || r._keywordScore || 0;
    const sem = r.semanticScore || r._semanticScore || 0;
    return kw > 0.1 || sem > 0.15;
  });

  // Deduplicate
  rawResults = deduplicate(rawResults);

  // Limit results
  const limited = rawResults.slice(0, Math.min(max_results, 20));

  // Format as WebSearchResult[]
  let totalExcerptChars = 0;
  const results = limited.map((r) => {
    const remainingChars = maxCharsTotal - totalExcerptChars;
    const excerptsArr = generateExcerpts(
      r.content,
      maxCharsPerResult,
      remainingChars > 0 ? remainingChars : maxCharsPerResult
    );
    totalExcerptChars += excerptsArr.join('').length;

    return {
      url:          r.sourceUrl || r.citation?.url || '',
      title:        r.pageTitle || r.citation?.title || r.source?.name || '',
      excerpts:     excerptsArr,
      publish_date: r.citation?.publishedAt
        ? new Date(r.citation.publishedAt).toISOString().split('T')[0]
        : null,
    };
  });

  const responseTime = Date.now() - startTime;

  // Log search
  try {
    await SearchLog.create({
      query: objective || (search_queries || []).join(', '),
      filters: source_policy,
      resultCount: results.length,
      topResults: results.slice(0, 5).map((r) => ({
        sourceUrl: r.url,
        title: r.title,
        score: 0,
      })),
      searchType: processor === 'base' ? 'hybrid' : 'deep',
      responseTime,
      user: userId,
      ip,
    });
  } catch { /* non-critical */ }

  return {
    results,
    search_id: searchId,
    usage: [{
      name: `search_${processor}`,
      count: 1,
    }],
    warnings: results.length === 0
      ? [{ type: 'warning', message: 'No results found matching your query. Try broadening your search.' }]
      : [],
    _meta: { responseTime, processor, mode },
  };
}

module.exports = { search };

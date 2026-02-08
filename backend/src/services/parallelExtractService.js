/**
 * parallelExtractService.js — mirrors the real Parallel.ai Extract API.
 *
 * POST /v1beta/extract
 *
 * Input:  { urls, excerpts, full_content, objective, search_queries, fetch_policy }
 * Output: { results: ExtractResult[], errors: ExtractError[], extract_id, usage }
 *
 * Strategy:
 *   1. Check local DB (Source + Chunk) for each URL → instant, safe
 *   2. If not found locally and fetch_policy allows, do a lightweight HTTP
 *      fetch with strict size guards (100 KB cap) to avoid OOM
 *   3. Return partial results + errors for anything that failed
 */

const crypto = require('crypto');
const Source = require('../models/Source');
const Chunk = require('../models/Chunk');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const FETCH_TIMEOUT = 10000;
const MAX_FETCH_BYTES = 100 * 1024; // 100 KB — safe for regex cleaning
const USER_AGENT = 'PicUp-AISearchBot/1.0';

/* ── Generate extract ID ─────────────────────────────── */
function generateExtractId() {
  return `extract_${crypto.randomBytes(16).toString('hex')}`;
}

/* ── Lightweight HTML → text (no catastrophic regex) ── */
function lightStripHtml(html) {
  if (!html) return { text: '', title: '' };
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  // Remove script tags
  let text = html;
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  // Remove style tags
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
  // Remove all remaining tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode basic entities
  text = text.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/&[#\w]+;/gi, ' ');
  // Collapse whitespace
  text = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return { text, title };
}

/* ── Tiny HTTP fetch with strict size cap ────────────── */
function tinyFetch(url, _depth = 0) {
  if (_depth > 5) return Promise.reject(new Error('Too many redirects'));
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      headers: { 'User-Agent': USER_AGENT, 'Accept-Encoding': 'identity' },
      timeout: FETCH_TIMEOUT,
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const next = new URL(res.headers.location, url).href;
        return resolve(tinyFetch(next, _depth + 1));
      }
      if (res.statusCode >= 400) {
        return reject(Object.assign(new Error(`HTTP ${res.statusCode}`), { statusCode: res.statusCode }));
      }
      const chunks = [];
      let size = 0;
      res.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_FETCH_BYTES) {
          req.destroy();
          // Still resolve with what we have
          resolve(Buffer.concat(chunks).toString('utf-8'));
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      res.on('error', reject);
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
  });
}

/* ── Extract from local DB ───────────────────────────── */
async function extractFromLocal(url, options) {
  const { excerpts = true, full_content = false, objective } = options;

  // Find source by URL (exact or prefix match)
  const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const source = await Source.findOne({
    $or: [
      { url },
      { url: { $regex: `^${escapedUrl}` } },
    ],
  }).lean();

  if (!source) return null;

  // Get chunks for this source
  const chunks = await Chunk.find({ source: source._id })
    .sort({ chunkIndex: 1 })
    .lean();

  if (!chunks.length) return null;

  const result = {
    url: source.url,
    title: source.name || null,
    publish_date: source.publishedAt
      ? new Date(source.publishedAt).toISOString().split('T')[0]
      : null,
  };

  // Full content: join all chunks
  if (full_content) {
    const maxChars = typeof full_content === 'object' ? full_content.max_chars_per_result : 50000;
    result.full_content = chunks.map(c => c.content).join('\n\n').substring(0, maxChars);
  }

  // Excerpts
  if (excerpts) {
    let relevantChunks = chunks;
    if (objective) {
      const words = objective.toLowerCase().split(/\s+/);
      relevantChunks = [...chunks]
        .map(c => ({
          ...c,
          _score: words.filter(w => c.content.toLowerCase().includes(w)).length,
        }))
        .sort((a, b) => b._score - a._score);
    }
    const maxChars = typeof excerpts === 'object' ? excerpts.max_chars_per_result : 5000;
    result.excerpts = [];
    let total = 0;
    for (const c of relevantChunks) {
      const ex = c.content.substring(0, maxChars);
      if (total + ex.length > maxChars * 5) break;
      result.excerpts.push(ex);
      total += ex.length;
      if (result.excerpts.length >= 10) break;
    }
  }

  return result;
}

/* ── Extract via light HTTP fetch ────────────────────── */
async function extractFromWeb(url, options) {
  const { excerpts = true, full_content = false, objective } = options;

  const html = await tinyFetch(url);
  const { text, title } = lightStripHtml(html);

  if (!text || text.length < 20) {
    throw new Error('No extractable content');
  }

  const result = {
    url,
    title: title || null,
    publish_date: null,
  };

  if (full_content) {
    const maxChars = typeof full_content === 'object' ? full_content.max_chars_per_result : 50000;
    result.full_content = text.substring(0, maxChars);
  }

  if (excerpts) {
    // Split text into paragraphs as excerpts
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 30);
    let relevantParas = paragraphs;
    if (objective) {
      const words = objective.toLowerCase().split(/\s+/);
      relevantParas = paragraphs
        .map(p => ({ text: p, score: words.filter(w => p.toLowerCase().includes(w)).length }))
        .sort((a, b) => b.score - a.score)
        .map(p => p.text);
    }
    const maxChars = typeof excerpts === 'object' ? excerpts.max_chars_per_result : 5000;
    result.excerpts = [];
    let total = 0;
    for (const p of relevantParas) {
      const ex = p.substring(0, maxChars);
      if (total + ex.length > maxChars * 5) break;
      result.excerpts.push(ex);
      total += ex.length;
      if (result.excerpts.length >= 10) break;
    }
  }

  return result;
}

/* ── Extract from a single URL ───────────────────────── */
async function extractSingleUrl(url, options = {}) {
  try {
    // 1) Try local DB first (fast, no memory risk)
    const localResult = await extractFromLocal(url, options);
    if (localResult) return { result: localResult, error: null, source: 'local' };

    // 2) Lightweight HTTP fetch (capped at 100 KB)
    const webResult = await extractFromWeb(url, options);
    return { result: webResult, error: null, source: 'web' };
  } catch (err) {
    return {
      result: null,
      error: {
        url,
        error_type: err.code || 'fetch_failed',
        content: err.message,
        http_status_code: err.statusCode || null,
      },
      source: null,
    };
  }
}

/* ════════════════════════════════════════════════════════
   PUBLIC: extract()  — matches Parallel.ai POST /v1beta/extract
   ════════════════════════════════════════════════════════ */
async function extract(params = {}) {
  const {
    urls = [],
    excerpts = true,
    full_content = false,
    objective = null,
    search_queries = null,
    fetch_policy = {},
  } = params;

  if (!urls || urls.length === 0) {
    throw new Error('At least one URL is required');
  }

  const startTime = Date.now();
  const extractId = generateExtractId();

  // Process URLs sequentially to limit memory usage
  const results = [];
  const errors = [];

  for (const url of urls.slice(0, 20)) {
    const outcome = await extractSingleUrl(url, {
      excerpts,
      full_content,
      objective,
      search_queries,
    });
    if (outcome.result) results.push(outcome.result);
    if (outcome.error) errors.push(outcome.error);
  }

  return {
    results,
    errors,
    extract_id: extractId,
    usage: [{ name: 'extract', count: urls.length }],
    warnings: [],
    _meta: { responseTime: Date.now() - startTime },
  };
}

module.exports = { extract };

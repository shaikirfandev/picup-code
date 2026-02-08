/**
 * ChunkingService — splits cleaned text into semantically meaningful
 * chunks optimized for embedding and retrieval.
 *
 * Strategies:
 *   1. Semantic — split on headings / paragraph boundaries
 *   2. Fixed-size — sliding window with overlap
 *   3. Hybrid — semantic first, then split oversized chunks
 */

const crypto = require('crypto');

const DEFAULT_CHUNK_SIZE = 512;       // tokens (≈ chars / 4)
const DEFAULT_CHUNK_OVERLAP = 64;
const MAX_CHUNK_CHARS = 2500;
const MIN_CHUNK_CHARS = 80;

/* ── Semantic boundary detection ────────────────────── */
const HEADING_REGEX = /^#{1,6}\s+.+$|^[A-Z][A-Z\s]{3,60}$/m;
const PARAGRAPH_BREAK = /\n{2,}/;

function findSemanticBoundaries(text) {
  const boundaries = [];
  const lines = text.split('\n');
  let pos = 0;

  for (const line of lines) {
    if (HEADING_REGEX.test(line.trim()) || line.trim() === '') {
      boundaries.push(pos);
    }
    pos += line.length + 1; // +1 for \n
  }

  return boundaries;
}

/* ── Fixed-size chunking with overlap ───────────────── */
function fixedSizeChunk(text, chunkSize = MAX_CHUNK_CHARS, overlap = DEFAULT_CHUNK_OVERLAP * 4) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Try to break at sentence boundary
    if (end < text.length) {
      const searchRegion = text.substring(end - 100, end + 100);
      const sentenceEnd = searchRegion.search(/[.!?]\s/);
      if (sentenceEnd !== -1) {
        end = end - 100 + sentenceEnd + 2;
      }
    } else {
      end = text.length;
    }

    const chunk = text.substring(start, end).trim();
    if (chunk.length >= MIN_CHUNK_CHARS) {
      chunks.push(chunk);
    }

    start = end - overlap;
    if (start >= text.length) break;
  }

  return chunks;
}

/* ── Semantic chunking ──────────────────────────────── */
function semanticChunk(text) {
  // Split on double newlines (paragraphs) and headings
  const sections = text.split(PARAGRAPH_BREAK).filter((s) => s.trim().length > 0);

  const chunks = [];
  let current = '';

  for (const section of sections) {
    const trimmed = section.trim();

    // If adding this section would exceed max, flush current
    if (current.length + trimmed.length > MAX_CHUNK_CHARS && current.length >= MIN_CHUNK_CHARS) {
      chunks.push(current.trim());
      current = '';
    }

    // If a single section is too large, split it with fixed-size
    if (trimmed.length > MAX_CHUNK_CHARS) {
      if (current.length >= MIN_CHUNK_CHARS) {
        chunks.push(current.trim());
        current = '';
      }
      const subChunks = fixedSizeChunk(trimmed);
      chunks.push(...subChunks);
      continue;
    }

    current += (current ? '\n\n' : '') + trimmed;
  }

  if (current.trim().length >= MIN_CHUNK_CHARS) {
    chunks.push(current.trim());
  }

  return chunks;
}

/* ── Hybrid chunking (default) ──────────────────────── */
function hybridChunk(text) {
  if (!text || text.trim().length < MIN_CHUNK_CHARS) {
    return text && text.trim().length > 0 ? [text.trim()] : [];
  }

  // First pass: semantic
  let chunks = semanticChunk(text);

  // Second pass: split any oversized chunks
  const finalChunks = [];
  for (const chunk of chunks) {
    if (chunk.length > MAX_CHUNK_CHARS) {
      finalChunks.push(...fixedSizeChunk(chunk));
    } else {
      finalChunks.push(chunk);
    }
  }

  return finalChunks;
}

/* ── Hash for deduplication ─────────────────────────── */
function contentHash(text) {
  return crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
}

/* ── Create chunk objects with metadata ─────────────── */
function createChunks(text, meta = {}) {
  const rawChunks = hybridChunk(text);

  return rawChunks.map((content, index) => ({
    content,
    contentHash: contentHash(content),
    charCount: content.length,
    wordCount: content.split(/\s+/).length,
    position: index,
    section: meta.section || '',
    pageTitle: meta.pageTitle || '',
    citation: {
      title: meta.title || meta.pageTitle || '',
      url: meta.url || '',
      domain: meta.domain || '',
      publishedAt: meta.publishedAt || null,
      author: meta.author || '',
      snippet: content.substring(0, 200),
    },
  }));
}

module.exports = {
  hybridChunk,
  semanticChunk,
  fixedSizeChunk,
  contentHash,
  createChunks,
  MAX_CHUNK_CHARS,
  MIN_CHUNK_CHARS,
};

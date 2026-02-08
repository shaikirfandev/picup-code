/**
 * EmbeddingService — generates vector embeddings from text.
 *
 * Supports pluggable providers:
 *   - openai   (text-embedding-3-small / 3-large)
 *   - local    (placeholder for ONNX / Instructor / BGE)
 *   - mock     (deterministic random vectors for dev)
 *
 * Usage:
 *   const { embed, embedBatch } = require('./embeddingService');
 *   const vec = await embed('hello world');
 *   const vecs = await embedBatch(['hello', 'world']);
 */

const crypto = require('crypto');

const PROVIDER = process.env.EMBEDDING_PROVIDER || 'mock'; // openai | local | mock
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const EMBEDDING_DIM = parseInt(process.env.EMBEDDING_DIM || (PROVIDER === 'mock' ? '64' : '1536'), 10);

/* ────────────────────────────────────────────────────── */
/*  Provider: OpenAI                                       */
/* ────────────────────────────────────────────────────── */
async function openaiEmbed(texts) {
  const fetch = (await import('node-fetch')).default;
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embedding error: ${res.status} ${err}`);
  }
  const json = await res.json();
  return json.data.map((d) => d.embedding);
}

/* ────────────────────────────────────────────────────── */
/*  Provider: Mock (deterministic hash → float vector)     */
/* ────────────────────────────────────────────────────── */
function mockEmbed(texts) {
  return texts.map((t) => {
    const hash = crypto.createHash('sha256').update(t).digest();
    const vec = [];
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      // deterministic float from byte cycling
      vec.push(((hash[i % hash.length] + i) % 256) / 255 - 0.5);
    }
    // L2 normalize
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  });
}

/* ────────────────────────────────────────────────────── */
/*  Public API                                             */
/* ────────────────────────────────────────────────────── */
async function embedBatch(texts) {
  if (!texts || texts.length === 0) return [];
  switch (PROVIDER) {
    case 'openai':
      return openaiEmbed(texts);
    case 'mock':
    default:
      return mockEmbed(texts);
  }
}

async function embed(text) {
  const [vec] = await embedBatch([text]);
  return vec;
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

module.exports = {
  embed,
  embedBatch,
  cosineSimilarity,
  EMBEDDING_MODEL,
  EMBEDDING_DIM,
};

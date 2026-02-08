/**
 * parallelChatService.js — mirrors the real Parallel.ai Chat API.
 *
 * POST /v1beta/chat/completions — create chat completion
 * POST /v1beta/chat/sessions    — create session
 * GET  /v1beta/chat/sessions/:id — get session
 *
 * Chat completions with web-grounded search capability.
 * Messages include citations when web_search is enabled.
 */

const ChatSession = require('../models/ChatSession');
const { search }  = require('./parallelSearchService');
const crypto       = require('crypto');

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

/* ── LLM call ────────────────────────────────────────── */
async function llmCall(messages, jsonMode = false) {
  if (!OPENAI_KEY) return { content: null, tokens: 0 };
  const fetch = (await import('node-fetch')).default;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
      messages,
      max_tokens: 2048,
      temperature: 0.7,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  const json = await res.json();
  return {
    content: json.choices?.[0]?.message?.content || '',
    tokens: json.usage?.total_tokens || 0,
  };
}

/* ── Generate search queries from conversation ───────── */
function deriveSearchQueries(messages) {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUser) return [];
  const text = lastUser.content;
  // Split into sentence-like queries and also use the whole thing
  const sentences = text.split(/[.?!]+/).map(s => s.trim()).filter(s => s.length > 10);
  return [text, ...sentences].slice(0, 3);
}

/* ── Build response with citations ───────────────────── */
function buildGroundedResponse(question, searchResults) {
  if (!searchResults || searchResults.length === 0) {
    return {
      content: `Based on available information: ${question}\n\nI couldn't find specific results to ground my response. Please try rephrasing your question or provide more context.`,
      citations: [],
      search_queries: [question],
    };
  }

  const citations = searchResults.slice(0, 5).map(r => ({
    url:      r.url,
    title:    r.title,
    excerpts: (r.excerpts || []).slice(0, 2),
    domain:   r.url ? new URL(r.url).hostname : 'unknown',
  }));

  // Build response from excerpts
  const lines = [];
  lines.push(`Here's what I found regarding your question:\n`);

  for (let i = 0; i < citations.length; i++) {
    const c = citations[i];
    const excerpt = (c.excerpts[0] || '').substring(0, 200);
    if (excerpt) {
      lines.push(`**[${i + 1}] ${c.title}** (${c.domain})`);
      lines.push(`${excerpt}${excerpt.length >= 200 ? '...' : ''}\n`);
    }
  }

  lines.push(`\n_Sources: ${citations.map((c, i) => `[${i + 1}]`).join(' ')}_`);

  return {
    content: lines.join('\n'),
    citations,
    search_queries: [question],
  };
}

/* ════════════════════════════════════════════════════════
   PUBLIC: createCompletion()
   ════════════════════════════════════════════════════════ */
async function createCompletion(params = {}) {
  const {
    messages = [],
    model = 'parallel-chat-1',
    web_search_enabled = true,
    source_policy = {},
    session_id = null,
    userId = null,
  } = params;

  if (!messages.length) throw new Error('messages array is required');

  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUserMsg) throw new Error('At least one user message is required');

  let citations = [];
  let searchQueries = [];
  let searchUsage = {};
  let totalTokens = 0;

  // If web search is enabled, search for grounding context
  if (web_search_enabled) {
    searchQueries = deriveSearchQueries(messages);
    try {
      const searchResult = await search({
        objective: lastUserMsg.content,
        search_queries: searchQueries,
        max_results: 8,
        processor: 'pro',
        source_policy,
      });
      citations = (searchResult.results || []).slice(0, 5).map(r => ({
        url:      r.url,
        title:    r.title,
        excerpts: (r.excerpts || []).slice(0, 2),
        domain:   r.url ? new URL(r.url).hostname : 'unknown',
      }));
      searchUsage = searchResult.usage || {};
    } catch (err) {
      console.warn('Chat search grounding failed:', err.message);
    }
  }

  let assistantContent;

  if (OPENAI_KEY) {
    // Build context-enriched messages for LLM
    const contextBlock = citations.length > 0
      ? `\n\nWeb search results for context:\n${citations.map((c, i) => `[${i + 1}] ${c.title} (${c.url})\n${(c.excerpts || []).join('\n')}`).join('\n\n')}\n\nUse these sources to ground your response. Cite sources with [n] notation.`
      : '';

    const llmMessages = [
      {
        role: 'system',
        content: `You are Parallel AI, an intelligent research assistant. Provide accurate, well-sourced responses.${contextBlock}`,
      },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ];

    const llmResult = await llmCall(llmMessages);
    assistantContent = llmResult.content;
    totalTokens += llmResult.tokens;
  } else {
    // Heuristic response using search results
    const grounded = buildGroundedResponse(lastUserMsg.content, citations.length > 0 ? citations.map(c => ({ ...c, excerpts: c.excerpts })) : []);
    assistantContent = grounded.content;
  }

  // Create the assistant message
  const assistantMessage = {
    role: 'assistant',
    content: assistantContent,
    citations,
    search_queries: searchQueries,
  };

  // Save to session if provided
  if (session_id) {
    const session = await ChatSession.findOne({ session_id });
    if (session) {
      session.messages.push(
        { role: lastUserMsg.role, content: lastUserMsg.content },
        assistantMessage
      );
      session.usage.push({
        type: 'chat_completion',
        tokens: totalTokens,
        timestamp: new Date(),
      });
      await session.save();
    }
  }

  const completionId = `chatcmpl_${crypto.randomBytes(8).toString('hex')}`;

  return {
    id: completionId,
    object: 'chat.completion',
    model,
    created: Math.floor(Date.now() / 1000),
    choices: [{
      index: 0,
      message: assistantMessage,
      finish_reason: 'stop',
    }],
    usage: {
      prompt_tokens:     totalTokens > 0 ? Math.floor(totalTokens * 0.7) : 0,
      completion_tokens: totalTokens > 0 ? Math.floor(totalTokens * 0.3) : 0,
      total_tokens:      totalTokens,
      search_queries:    searchQueries.length,
      sources_consulted: citations.length,
    },
    web_search_enabled,
    session_id,
  };
}

/* ── Create session ──────────────────────────────────── */
async function createSession(params = {}) {
  const {
    model = 'parallel-chat-1',
    web_search_enabled = true,
    source_policy = {},
    userId = null,
  } = params;

  const session = await ChatSession.create({
    model,
    web_search_enabled,
    source_policy,
    user: userId,
  });

  return {
    session_id:         session.session_id,
    model:              session.model,
    web_search_enabled: session.web_search_enabled,
    source_policy:      session.source_policy,
    created_at:         session.createdAt?.toISOString(),
  };
}

/* ── Get session ─────────────────────────────────────── */
async function getSession(sessionId) {
  return ChatSession.findOne({ session_id: sessionId }).lean();
}

/* ── List sessions ───────────────────────────────────── */
async function listSessions(userId, limit = 20, offset = 0) {
  const query = userId ? { user: userId } : {};
  const sessions = await ChatSession.find(query)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .select('session_id model web_search_enabled createdAt')
    .lean();
  return sessions;
}

module.exports = {
  createCompletion,
  createSession,
  getSession,
  listSessions,
};

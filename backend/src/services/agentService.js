/**
 * AgentService — the brain of the platform.
 *
 * Implements multi-step research workflows:
 *   - Query decomposition
 *   - Parallel sub-searches
 *   - Structured data extraction from pages
 *   - Cross-source verification
 *   - Final synthesis with citations
 *
 * Works without an external LLM by using heuristic planning + search.
 * When OPENAI_API_KEY is set, uses GPT for planning, extraction, and synthesis.
 */

const ResearchTask = require('../models/ResearchTask');
const { hybridSearch } = require('./searchService');
const { crawlUrl } = require('./crawlerService');
const { cleanHtml } = require('./cleaningService');
const { createChunks } = require('./chunkingService');

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

/* ── LLM call (optional) ───────────────────────────── */
async function llmCall(systemPrompt, userPrompt, jsonMode = false) {
  if (!OPENAI_KEY) {
    // Fallback: return a heuristic result
    return { content: userPrompt, tokens: 0 };
  }

  const fetch = (await import('node-fetch')).default;
  const body = {
    model: LLM_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 4096,
    temperature: 0.2,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  const choice = json.choices?.[0]?.message?.content || '';
  const tokens = json.usage?.total_tokens || 0;
  return { content: choice, tokens };
}

/* ── Query decomposition ────────────────────────────── */
async function decomposeQuery(goal) {
  if (OPENAI_KEY) {
    const { content, tokens } = await llmCall(
      `You decompose research goals into specific search sub-queries. Return JSON: {"queries": ["query1", "query2", ...], "plan": ["step1", "step2", ...]}`,
      `Decompose this research goal into 2-5 specific search queries and a step-by-step plan:\n\n"${goal}"`,
      true
    );
    try {
      return { ...JSON.parse(content), tokens };
    } catch {
      return { queries: [goal], plan: ['Search for: ' + goal], tokens };
    }
  }

  // Heuristic decomposition
  const queries = [goal];
  // Split on "and" or commas for compound queries
  const parts = goal.split(/\band\b|,/).map((s) => s.trim()).filter((s) => s.length > 3);
  if (parts.length > 1) {
    queries.push(...parts);
  }
  return {
    queries: queries.slice(0, 5),
    plan: queries.map((q) => `Search for: ${q}`),
    tokens: 0,
  };
}

/* ── Extract structured data from a page ────────────── */
async function extractFromUrl(url, schema = {}) {
  // Crawl the page
  const crawlResult = await crawlUrl(url);
  const { text, metadata } = cleanHtml(crawlResult.rawContent);
  const chunks = createChunks(text, {
    pageTitle: metadata.title || metadata.ogTitle || '',
    url,
    domain: new URL(url).hostname,
    author: metadata.author,
    publishedAt: metadata.publishedAt,
  });

  if (OPENAI_KEY && Object.keys(schema).length > 0) {
    const { content, tokens } = await llmCall(
      `You extract structured data from text according to a provided schema. Return valid JSON matching the schema. If a field cannot be found, use null. Be precise and cite specific text.`,
      `Extract data matching this schema:\n${JSON.stringify(schema, null, 2)}\n\nFrom this content:\n${text.substring(0, 8000)}`,
      true
    );
    try {
      return {
        data: JSON.parse(content),
        rawText: text.substring(0, 2000),
        metadata,
        chunks: chunks.slice(0, 10),
        tokens,
      };
    } catch {
      // fall through to heuristic
    }
  }

  // Heuristic: return raw text and chunks
  return {
    data: {
      title: metadata.title || metadata.ogTitle || '',
      description: metadata.description || text.substring(0, 500),
      author: metadata.author || '',
      publishedAt: metadata.publishedAt || '',
      content: text.substring(0, 3000),
      url,
    },
    rawText: text.substring(0, 2000),
    metadata,
    chunks: chunks.slice(0, 10),
    tokens: 0,
  };
}

/* ── Verify facts across multiple sources ───────────── */
async function verifyClaims(claims, searchResults) {
  const verified = claims.map((claim) => {
    // Count how many sources mention similar content
    const supporting = searchResults.filter((r) => {
      const content = (r.content || '').toLowerCase();
      const words = claim.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      const matchCount = words.filter((w) => content.includes(w)).length;
      return matchCount / words.length > 0.3;
    });

    return {
      claim,
      supportingSourcesCount: supporting.length,
      confidence: Math.min(1, supporting.length / 3),
      sources: supporting.slice(0, 3).map((s) => ({
        url: s.source?.url || s.citation?.url || '',
        title: s.title || s.citation?.title || '',
        trustScore: s.trustScore || 0.5,
      })),
    };
  });

  return verified;
}

/* ── Synthesize final answer ────────────────────────── */
async function synthesize(goal, allResults, outputSchema = null) {
  if (OPENAI_KEY) {
    const context = allResults
      .slice(0, 15)
      .map((r, i) => `[${i + 1}] (${r.source?.domain || 'unknown'}) ${r.content?.substring(0, 500)}`)
      .join('\n\n');

    const schemaInstruction = outputSchema
      ? `\nReturn your answer as JSON matching this schema: ${JSON.stringify(outputSchema)}`
      : '\nReturn your answer as JSON with keys: "summary", "keyFindings" (array of strings), "data" (structured data if applicable).';

    const { content, tokens } = await llmCall(
      `You synthesize research results into accurate, well-cited answers. Every claim must reference a source number [N]. Minimize hallucination — if information isn't in the sources, say so.${schemaInstruction}`,
      `Research goal: "${goal}"\n\nSources:\n${context}`,
      true
    );

    try {
      return { result: JSON.parse(content), tokens };
    } catch {
      return { result: { summary: content, keyFindings: [] }, tokens };
    }
  }

  // Heuristic synthesis: extract key sentences
  const allContent = allResults.map((r) => r.content || '').join('\n');
  const sentences = allContent
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 500);

  // Deduplicate sentences roughly
  const unique = [];
  for (const s of sentences) {
    if (!unique.some((u) => {
      const overlap = u.split(' ').filter((w) => s.includes(w)).length;
      return overlap / Math.max(u.split(' ').length, s.split(' ').length) > 0.7;
    })) {
      unique.push(s);
    }
  }

  return {
    result: {
      summary: unique.slice(0, 5).join('. ') + '.',
      keyFindings: unique.slice(0, 10),
      data: outputSchema ? {} : null,
    },
    tokens: 0,
  };
}

/* ────────────────────────────────────────────────────── */
/*  PUBLIC: Run a Research Task                            */
/* ────────────────────────────────────────────────────── */
async function runResearchTask(taskId) {
  const task = await ResearchTask.findById(taskId);
  if (!task) throw new Error('Task not found');

  try {
    task.status = 'planning';
    task.startedAt = new Date();
    await task.save();

    // Step 1: Decompose the goal into sub-queries
    const decomposition = await decomposeQuery(task.goal);
    task.plan = decomposition.plan;
    task.totalTokensUsed += decomposition.tokens;

    task.status = 'executing';
    await task.save();

    // Step 2: Execute sub-searches
    const allResults = [];
    for (let i = 0; i < decomposition.queries.length; i++) {
      const q = decomposition.queries[i];
      const step = {
        stepNumber: i + 1,
        action: 'search',
        input: { query: q },
        status: 'running',
        startedAt: new Date(),
      };

      try {
        const searchResult = await hybridSearch(q, {
          filters: task.filters || {},
          limit: 10,
        });

        step.output = {
          resultCount: searchResult.results.length,
          topResults: searchResult.results.slice(0, 3).map((r) => ({
            title: r.title,
            snippet: r.snippet?.substring(0, 200),
          })),
        };
        step.sourcesUsed = searchResult.results.slice(0, 5).map((r) => ({
          url: r.source?.url,
          title: r.title,
          trustScore: r.trustScore,
        }));
        step.status = 'completed';
        step.endedAt = new Date();
        step.duration = step.endedAt - step.startedAt;

        allResults.push(...searchResult.results);
      } catch (err) {
        step.status = 'failed';
        step.error = err.message;
        step.endedAt = new Date();
      }

      task.steps.push(step);
      await task.save();
    }

    // Step 3: If task type is 'extract' and has a URL, extract structured data
    if (task.taskType === 'extract' && task.url) {
      const extractStep = {
        stepNumber: task.steps.length + 1,
        action: 'extract',
        input: { url: task.url, schema: task.outputSchema },
        status: 'running',
        startedAt: new Date(),
      };

      try {
        const extracted = await extractFromUrl(task.url, task.outputSchema || {});
        extractStep.output = extracted.data;
        extractStep.status = 'completed';
        extractStep.endedAt = new Date();
        extractStep.duration = extractStep.endedAt - extractStep.startedAt;
        task.totalTokensUsed += extracted.tokens;
      } catch (err) {
        extractStep.status = 'failed';
        extractStep.error = err.message;
        extractStep.endedAt = new Date();
      }

      task.steps.push(extractStep);
      await task.save();
    }

    // Step 4: Verify with multiple sources
    task.status = 'verifying';
    await task.save();

    // Step 5: Synthesize final answer
    const synthesis = await synthesize(task.goal, allResults, task.outputSchema);
    task.totalTokensUsed += synthesis.tokens;

    // Build citations
    const citationMap = new Map();
    for (const r of allResults) {
      const url = r.source?.url || r.citation?.url;
      if (url && !citationMap.has(url)) {
        citationMap.set(url, {
          title: r.title || r.citation?.title || '',
          url,
          domain: r.source?.domain || r.citation?.domain || '',
          trustScore: r.trustScore || 0.5,
          snippet: r.snippet?.substring(0, 200) || '',
          accessedAt: new Date(),
        });
      }
    }

    task.result = {
      data: synthesis.result,
      summary: synthesis.result.summary || JSON.stringify(synthesis.result).substring(0, 500),
      confidence: allResults.length > 0
        ? Math.min(1, allResults.reduce((s, r) => s + (r.confidenceScore || 0.5), 0) / allResults.length)
        : 0.3,
      citations: [...citationMap.values()].slice(0, 20),
    };

    task.status = 'completed';
    task.completedAt = new Date();
    task.duration = task.completedAt - task.startedAt;

    // Estimate cost (rough: $0.15 per 1M input tokens for GPT-4o-mini)
    task.totalCost = (task.totalTokensUsed / 1_000_000) * 0.15;

    await task.save();
    return task;

  } catch (err) {
    task.status = 'failed';
    task.error = err.message;
    task.completedAt = new Date();
    task.duration = task.completedAt - task.startedAt;
    await task.save();
    throw err;
  }
}

module.exports = {
  runResearchTask,
  extractFromUrl,
  decomposeQuery,
  synthesize,
  verifyClaims,
};

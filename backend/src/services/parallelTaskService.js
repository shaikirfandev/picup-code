/**
 * parallelTaskService.js — mirrors the real Parallel.ai Task API.
 *
 * POST /v1/tasks/runs  — create task run
 * GET  /v1/tasks/runs/:id  — retrieve status
 * GET  /v1/tasks/runs/:id/result  — get result (blocks until done)
 * GET  /v1/tasks/runs/:id/events  — SSE stream
 *
 * Processors:
 *   base  — fast, single-pass search + synthesis
 *   pro   — multi-pass with cross-validation
 *   ultra — deep research with extensive sourcing
 */

const TaskRun = require('../models/TaskRun');
const { search } = require('./parallelSearchService');
const { extract } = require('./parallelExtractService');
const { crawlUrl } = require('./crawlerService');
const { cleanHtml } = require('./cleaningService');

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

/* ── LLM call (optional) ────────────────────────────── */
async function llmCall(systemPrompt, userPrompt, jsonMode = false) {
  if (!OPENAI_KEY) {
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

/* ── Decompose input into search queries ─────────────── */
async function decompose(input) {
  if (OPENAI_KEY) {
    const { content, tokens } = await llmCall(
      'Decompose the research question into 2-5 specific web search queries. Return JSON: {"queries": ["q1","q2",...], "plan": "brief plan"}',
      input,
      true
    );
    try {
      const parsed = JSON.parse(content);
      return { queries: parsed.queries || [input], plan: parsed.plan || '', tokens };
    } catch {
      return { queries: [input], plan: '', tokens };
    }
  }

  // Heuristic decomposition
  const queries = [input];
  const parts = input.split(/\band\b|,/).map(s => s.trim()).filter(s => s.length > 5);
  if (parts.length > 1) queries.push(...parts.slice(0, 3));
  return { queries: queries.slice(0, 5), plan: `Search for: ${input}`, tokens: 0 };
}

/* ── Synthesize results into output ──────────────────── */
async function synthesize(input, searchResults, outputSchema) {
  const context = searchResults
    .slice(0, 15)
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${(r.excerpts || []).join('\n')}\n`)
    .join('\n---\n');

  if (OPENAI_KEY) {
    const schemaInstr = outputSchema
      ? `\nReturn JSON matching this schema: ${JSON.stringify(outputSchema)}`
      : '\nReturn a comprehensive text answer.';

    const { content, tokens } = await llmCall(
      `You are a research assistant. Synthesize information from the provided search results to answer the question. Always cite sources using [1], [2], etc. Be thorough and accurate.${schemaInstr}`,
      `Question: ${input}\n\nSearch Results:\n${context}`,
      !!outputSchema
    );

    return { content, tokens, isJson: !!outputSchema };
  }

  // Heuristic synthesis without LLM
  const topExcerpts = searchResults
    .slice(0, 5)
    .map((r, i) => `[${i + 1}] ${r.title}: ${(r.excerpts || []).slice(0, 2).join(' ')}`)
    .join('\n\n');

  const summary = `Based on ${searchResults.length} sources:\n\n${topExcerpts}\n\nSources: ${searchResults.slice(0, 5).map((r, i) => `[${i + 1}] ${r.url}`).join(', ')}`;

  return { content: summary, tokens: 0, isJson: false };
}

/* ── Add event to task run ───────────────────────────── */
async function addEvent(taskRun, type, message, data = null) {
  taskRun.events.push({ type, message, timestamp: new Date(), data });
  await taskRun.save();
}

/* ════════════════════════════════════════════════════════
   PUBLIC: createRun()  — initiate a task run
   ════════════════════════════════════════════════════════ */
async function createRun(params = {}) {
  const {
    input,
    processor = 'base',
    output_schema = null,
    task_spec = null,
    source_policy = {},
    metadata = {},
    enable_events = false,
    userId = null,
  } = params;

  if (!input) throw new Error('Input is required');

  const taskRun = await TaskRun.create({
    input,
    processor,
    output_schema: output_schema || task_spec?.output_schema,
    task_spec,
    source_policy,
    metadata,
    enable_events,
    user: userId,
  });

  // Start async execution
  executeRun(taskRun._id).catch(err => {
    console.error(`TaskRun ${taskRun.run_id} failed:`, err.message);
  });

  return {
    run_id: taskRun.run_id,
    status: taskRun.status,
    processor: taskRun.processor,
    created_at: taskRun.createdAt?.toISOString(),
  };
}

/* ── Execute a task run asynchronously ───────────────── */
async function executeRun(taskRunId) {
  const taskRun = await TaskRun.findById(taskRunId);
  if (!taskRun) return;

  try {
    taskRun.status = 'running';
    taskRun.started_at = new Date();
    await addEvent(taskRun, 'task_run.progress_msg.plan', 'Analyzing research objective...');

    // Step 1: Decompose query
    const { queries, plan, tokens: decompTokens } = await decompose(taskRun.input);
    await addEvent(taskRun, 'task_run.progress_msg.plan', `Research plan: ${plan || queries.join(', ')}`);

    // Step 2: Search (number of passes depends on processor)
    const passes = taskRun.processor === 'ultra' ? 3 : taskRun.processor === 'pro' ? 2 : 1;
    let allResults = [];

    for (let pass = 0; pass < passes; pass++) {
      const passQueries = pass === 0 ? queries : queries.map(q => `${q} additional details`);
      await addEvent(taskRun, 'task_run.progress_msg.search',
        `Search pass ${pass + 1}/${passes}: ${passQueries.length} queries`);

      const searchResult = await search({
        objective: taskRun.input,
        search_queries: passQueries,
        max_results: taskRun.processor === 'ultra' ? 15 : 10,
        processor: taskRun.processor === 'ultra' ? 'pro' : 'base',
        source_policy: taskRun.source_policy || {},
      });

      allResults.push(...searchResult.results);
    }

    // Deduplicate across passes
    const seenUrls = new Set();
    allResults = allResults.filter(r => {
      if (seenUrls.has(r.url)) return false;
      seenUrls.add(r.url);
      return true;
    });

    taskRun.sources_considered = allResults.length;
    taskRun.sources_read = Math.min(allResults.length, 15);
    taskRun.sources_read_sample = allResults.slice(0, 10).map(r => r.url);

    await addEvent(taskRun, 'task_run.progress_msg.search',
      `Found ${allResults.length} relevant sources`);

    // Step 3: Synthesize
    await addEvent(taskRun, 'task_run.progress_msg.result', 'Synthesizing results...');

    const outputSchema = taskRun.output_schema || taskRun.task_spec?.output_schema;
    const { content, tokens: synthTokens, isJson } = await synthesize(
      taskRun.input,
      allResults,
      outputSchema?.type === 'auto' ? null : outputSchema
    );

    // Build citations
    const citations = allResults.slice(0, 10).map(r => ({
      url: r.url,
      title: r.title || '',
      excerpts: (r.excerpts || []).slice(0, 2),
      domain: r.url ? new URL(r.url).hostname : '',
    }));

    // Calculate confidence
    const confidence = Math.min(1, Math.max(0,
      0.3 +
      (allResults.length > 5 ? 0.2 : allResults.length * 0.04) +
      (citations.length > 3 ? 0.15 : citations.length * 0.05) +
      (passes > 1 ? 0.15 : 0) +
      (OPENAI_KEY ? 0.2 : 0)
    ));

    // Build output
    let output;
    if (isJson) {
      try {
        output = { type: 'json', structured_data: JSON.parse(content) };
      } catch {
        output = { type: 'text', content };
      }
    } else {
      output = { type: 'text', content };
    }

    // Update task run
    taskRun.output = output;
    taskRun.citations = citations;
    taskRun.confidence = confidence;
    taskRun.reasoning = `Analyzed ${allResults.length} sources across ${passes} search pass(es). ${citations.length} citations extracted.`;
    taskRun.status = 'completed';
    taskRun.completed_at = new Date();
    taskRun.duration_ms = Date.now() - taskRun.started_at.getTime();
    taskRun.usage = [
      { name: `task_${taskRun.processor}`, count: 1 },
      { name: 'search_queries', count: queries.length * passes },
    ];

    await addEvent(taskRun, 'task_run.completed', 'Research completed successfully');
    await taskRun.save();

  } catch (err) {
    taskRun.status = 'failed';
    taskRun.completed_at = new Date();
    taskRun.duration_ms = taskRun.started_at
      ? Date.now() - taskRun.started_at.getTime() : 0;
    taskRun.warnings = [{ type: 'warning', message: err.message }];
    await taskRun.save();
  }
}

/* ── Get run status ──────────────────────────────────── */
async function getRun(runId) {
  const taskRun = await TaskRun.findOne({ run_id: runId }).lean();
  if (!taskRun) return null;

  return {
    run_id:    taskRun.run_id,
    status:    taskRun.status,
    processor: taskRun.processor,
    input:     taskRun.input,
    created_at:  taskRun.createdAt?.toISOString(),
    started_at:  taskRun.started_at?.toISOString(),
    completed_at: taskRun.completed_at?.toISOString(),
  };
}

/* ── Get run result (returns when complete) ──────────── */
async function getRunResult(runId, timeout = 120000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const taskRun = await TaskRun.findOne({ run_id: runId }).lean();
    if (!taskRun) return null;

    if (['completed', 'failed', 'cancelled'].includes(taskRun.status)) {
      return {
        run_id:     taskRun.run_id,
        status:     taskRun.status,
        output:     taskRun.output || null,
        citations:  taskRun.citations || [],
        basis:      taskRun.basis || [],
        confidence: taskRun.confidence,
        reasoning:  taskRun.reasoning,
        warnings:   taskRun.warnings || [],
        usage:      taskRun.usage || [],
        sources_considered: taskRun.sources_considered,
        sources_read:       taskRun.sources_read,
        sources_read_sample: taskRun.sources_read_sample,
        created_at:  taskRun.createdAt?.toISOString(),
        completed_at: taskRun.completed_at?.toISOString(),
        duration_ms: taskRun.duration_ms,
      };
    }

    // Wait before polling again
    await new Promise(r => setTimeout(r, 1000));
  }

  throw new Error('Timeout waiting for task run to complete');
}

/* ── Get events for SSE streaming ────────────────────── */
async function getRunEvents(runId) {
  const taskRun = await TaskRun.findOne({ run_id: runId }).lean();
  if (!taskRun) return null;
  return taskRun.events || [];
}

module.exports = {
  createRun,
  getRun,
  getRunResult,
  getRunEvents,
  executeRun,
};

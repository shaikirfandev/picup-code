/**
 * parallelFindAllService.js — mirrors the real Parallel.ai FindAll API.
 *
 * POST /v1beta/findall/runs  — create FindAll run
 * GET  /v1beta/findall/runs/:id  — retrieve status
 * GET  /v1beta/findall/runs/:id/result  — get candidates
 * POST /v1beta/findall/runs/:id/cancel  — cancel
 * POST /v1beta/findall/ingest  — NL → spec
 *
 * Discovers entities matching conditions by searching, evaluating candidates.
 */

const FindAllRun = require('../models/FindAllRun');
const { search } = require('./parallelSearchService');
const crypto = require('crypto');

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

/* ── LLM call ────────────────────────────────────────── */
async function llmCall(systemPrompt, userPrompt, jsonMode = false) {
  if (!OPENAI_KEY) return { content: userPrompt, tokens: 0 };
  const fetch = (await import('node-fetch')).default;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2048,
      temperature: 0.2,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  const json = await res.json();
  return { content: json.choices?.[0]?.message?.content || '', tokens: json.usage?.total_tokens || 0 };
}

/* ── Evaluate candidate against match conditions ─────── */
async function evaluateCandidate(candidate, matchConditions) {
  const conditionResults = {};
  let matchCount = 0;

  for (const cond of matchConditions) {
    // Check if candidate data mentions anything related to the condition
    const searchText = `${candidate.name} ${candidate.description || ''} ${(candidate.excerpts || []).join(' ')}`.toLowerCase();
    const condWords = cond.description.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matchScore = condWords.filter(w => searchText.includes(w)).length / Math.max(condWords.length, 1);

    if (OPENAI_KEY) {
      const { content } = await llmCall(
        `Evaluate if this entity matches the condition. Return JSON: {"matches": true/false, "reasoning": "brief explanation"}`,
        `Entity: ${candidate.name}\nURL: ${candidate.url}\nDescription: ${candidate.description || 'N/A'}\n\nCondition: ${cond.name} - ${cond.description}`,
        true
      );
      try {
        const parsed = JSON.parse(content);
        conditionResults[cond.name] = parsed.matches;
        if (parsed.matches) matchCount++;
      } catch {
        conditionResults[cond.name] = matchScore > 0.3;
        if (matchScore > 0.3) matchCount++;
      }
    } else {
      conditionResults[cond.name] = matchScore > 0.3;
      if (matchScore > 0.3) matchCount++;
    }
  }

  const allMatch = matchCount === matchConditions.length;
  return {
    match_status: allMatch ? 'matched' : matchCount > 0 ? 'unmatched' : 'discarded',
    output: conditionResults,
  };
}

/* ════════════════════════════════════════════════════════
   PUBLIC: createRun()
   ════════════════════════════════════════════════════════ */
async function createRun(params = {}) {
  const {
    entity_type,
    objective,
    generator = 'base',
    match_conditions = [],
    match_limit = 10,
    exclude_list = [],
    metadata = {},
    userId = null,
  } = params;

  if (!entity_type || !objective) {
    throw new Error('entity_type and objective are required');
  }

  const run = await FindAllRun.create({
    entity_type,
    objective,
    generator,
    match_conditions,
    match_limit,
    exclude_list,
    metadata,
    user: userId,
  });

  // Start async execution
  executeFindAll(run._id).catch(err => {
    console.error(`FindAll ${run.findall_id} failed:`, err.message);
  });

  return {
    findall_id: run.findall_id,
    generator:  run.generator,
    status:     run.status,
    created_at: run.createdAt?.toISOString(),
  };
}

/* ── Execute FindAll run ─────────────────────────────── */
async function executeFindAll(runId) {
  const run = await FindAllRun.findById(runId);
  if (!run) return;

  try {
    run.status.status = 'running';
    run.status.is_active = true;
    await run.save();

    // Generate search queries from objective
    const searchQueries = [
      `${run.entity_type} ${run.objective}`,
      run.objective,
      `list of ${run.entity_type} ${run.objective.split(' ').slice(0, 3).join(' ')}`,
    ];

    // Search for candidates
    const searchResult = await search({
      objective: run.objective,
      search_queries: searchQueries,
      max_results: Math.min(run.match_limit * 3, 50),
      processor: run.generator === 'pro' ? 'pro' : 'base',
    });

    // Build candidate list from search results
    const excludeUrls = new Set((run.exclude_list || []).map(e => e.url));
    const candidateMap = new Map();

    for (const result of searchResult.results) {
      if (excludeUrls.has(result.url)) continue;
      if (candidateMap.has(result.url)) continue;

      const candidateId = `cand_${crypto.randomBytes(8).toString('hex')}`;
      candidateMap.set(result.url, {
        candidate_id: candidateId,
        name: result.title || new URL(result.url).hostname,
        url: result.url,
        description: (result.excerpts || []).slice(0, 2).join(' ').substring(0, 300),
        match_status: 'generated',
        excerpts: result.excerpts || [],
      });
    }

    const candidates = Array.from(candidateMap.values());
    run.status.metrics.candidates_generated = candidates.length;
    await run.save();

    // Evaluate each candidate against match conditions
    for (const candidate of candidates) {
      if (run.match_conditions.length > 0) {
        const evalResult = await evaluateCandidate(candidate, run.match_conditions);
        candidate.match_status = evalResult.match_status;
        candidate.output = evalResult.output;
      } else {
        candidate.match_status = 'matched';
      }

      // Update metrics
      if (candidate.match_status === 'matched') run.status.metrics.candidates_matched++;
      else if (candidate.match_status === 'unmatched') run.status.metrics.candidates_unmatched++;
      else if (candidate.match_status === 'discarded') run.status.metrics.candidates_discarded++;

      // Stop if we hit match limit
      if (run.status.metrics.candidates_matched >= run.match_limit) break;
    }

    // Save candidates (without the temporary excerpts field)
    run.candidates = candidates.map(c => ({
      candidate_id: c.candidate_id,
      name: c.name,
      url: c.url,
      description: c.description,
      match_status: c.match_status,
      output: c.output,
    }));

    // Update status
    run.status.status = 'completed';
    run.status.is_active = false;
    if (run.status.metrics.candidates_matched >= run.match_limit) {
      run.status.termination_reason = 'match_limit_met';
    } else {
      run.status.termination_reason = 'candidates_exhausted';
    }

    await run.save();

  } catch (err) {
    run.status.status = 'failed';
    run.status.is_active = false;
    run.status.termination_reason = 'error_occurred';
    await run.save();
  }
}

/* ── Get run ─────────────────────────────────────────── */
async function getRun(findallId) {
  return FindAllRun.findOne({ findall_id: findallId }).lean();
}

/* ── Get result ──────────────────────────────────────── */
async function getRunResult(findallId) {
  const run = await FindAllRun.findOne({ findall_id: findallId }).lean();
  if (!run) return null;

  return {
    run: {
      findall_id: run.findall_id,
      generator: run.generator,
      status: run.status,
      created_at: run.createdAt?.toISOString(),
      modified_at: run.updatedAt?.toISOString(),
    },
    candidates: run.candidates || [],
  };
}

/* ── Cancel run ──────────────────────────────────────── */
async function cancelRun(findallId) {
  const run = await FindAllRun.findOne({ findall_id: findallId });
  if (!run) return null;
  run.status.status = 'cancelled';
  run.status.is_active = false;
  run.status.termination_reason = 'user_cancelled';
  await run.save();
  return run;
}

/* ── Ingest: NL → FindAll spec ───────────────────────── */
async function ingest(params = {}) {
  const { objective } = params;
  if (!objective) throw new Error('Objective is required');

  if (OPENAI_KEY) {
    const { content } = await llmCall(
      'Generate a FindAll specification from a natural language objective. Return JSON: {"entity_type": "string", "objective": "string", "match_conditions": [{"name": "string", "description": "string"}], "match_limit": number}',
      `Generate a FindAll spec for: ${objective}`,
      true
    );
    try {
      return JSON.parse(content);
    } catch { /* fall through */ }
  }

  // Heuristic spec generation
  const words = objective.toLowerCase().split(/\s+/);
  const entityType = words.slice(0, 2).join(' ');

  return {
    entity_type: entityType,
    objective,
    match_conditions: [{
      name: 'relevance',
      description: `Must be relevant to: ${objective}`,
    }],
    match_limit: 10,
  };
}

module.exports = {
  createRun,
  getRun,
  getRunResult,
  cancelRun,
  ingest,
  executeFindAll,
};

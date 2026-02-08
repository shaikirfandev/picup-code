/**
 * parallelController.js — Full Parallel.ai-compatible API controller.
 *
 * Mirrors the real Parallel.ai platform with 6 core APIs:
 *   Search  — POST /search
 *   Extract — POST /extract
 *   Task    — POST /tasks/runs, GET /tasks/runs/:id, GET /tasks/runs/:id/result, GET /tasks/runs/:id/events
 *   FindAll — POST /findall/runs, GET /findall/runs/:id, GET /findall/runs/:id/result, POST /findall/runs/:id/cancel, POST /findall/ingest
 *   Chat    — POST /chat/completions, POST /chat/sessions, GET /chat/sessions/:id
 *   Monitor — POST /monitor/watches, GET /monitor/watches, GET /monitor/watches/:id, DELETE /monitor/watches/:id, POST /monitor/watches/:id/check, GET /monitor/watches/:id/changes
 *
 * Plus legacy source/chunk/stats admin endpoints.
 */

const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');
const parallelSearch   = require('../services/parallelSearchService');
const parallelExtract  = require('../services/parallelExtractService');
const parallelTask     = require('../services/parallelTaskService');
const parallelFindAll  = require('../services/parallelFindAllService');
const parallelChat     = require('../services/parallelChatService');
const parallelMonitor  = require('../services/parallelMonitorService');
const { ingestWithDepth, getPipelineStatus } = require('../services/ingestPipeline');
const Source      = require('../models/Source');
const Chunk       = require('../models/Chunk');
const CrawlJob    = require('../models/CrawlJob');
const TaskRun     = require('../models/TaskRun');
const FindAllRun  = require('../models/FindAllRun');
const ChatSession = require('../models/ChatSession');
const MonitorWatch = require('../models/MonitorWatch');
const SearchLog   = require('../models/SearchLog');

/* ═══════════════════════════════════════════════════════
   SEARCH API  — POST /search
   ═══════════════════════════════════════════════════════ */
exports.search = async (req, res) => {
  try {
    const {
      objective,
      search_queries,
      query,
      max_results = 20,
      excerpts = {},
      processor = 'base',
      mode = 'one-shot',
      source_policy = {},
      fetch_policy = {},
    } = req.body;

    const effectiveObjective = objective || query;
    const effectiveQueries   = search_queries || (query ? [query] : []);

    if (!effectiveObjective && !effectiveQueries.length) {
      return ApiResponse.error(res, 'objective or search_queries required', 400);
    }

    const result = await parallelSearch.search({
      objective:      effectiveObjective,
      search_queries: effectiveQueries,
      max_results:    Math.min(parseInt(max_results) || 20, 100),
      excerpts,
      processor,
      mode,
      source_policy,
      fetch_policy,
      userId: req.user?._id,
      ip:     req.ip,
    });

    return ApiResponse.success(res, result, 'Search completed');
  } catch (err) {
    console.error('Search error:', err);
    return ApiResponse.error(res, err.message);
  }
};

/* ═══════════════════════════════════════════════════════
   EXTRACT API  — POST /extract
   ═══════════════════════════════════════════════════════ */
exports.extract = async (req, res) => {
  try {
    const {
      urls,
      url,
      excerpts,
      full_content,
      objective,
      search_queries,
      fetch_policy,
    } = req.body;

    const effectiveUrls = urls || (url ? [url] : []);
    if (!effectiveUrls.length) {
      return ApiResponse.error(res, 'urls array is required', 400);
    }

    for (const u of effectiveUrls) {
      try { new URL(u); } catch { return ApiResponse.error(res, `Invalid URL: ${u}`, 400); }
    }

    const result = await parallelExtract.extract({
      urls: effectiveUrls,
      excerpts,
      full_content: full_content !== false,
      objective,
      search_queries,
      fetch_policy,
    });

    return ApiResponse.success(res, result, 'Extraction completed');
  } catch (err) {
    console.error('Extract error:', err);
    return ApiResponse.error(res, err.message);
  }
};

/* ═══════════════════════════════════════════════════════
   TASK API
   ═══════════════════════════════════════════════════════ */
exports.createTaskRun = async (req, res) => {
  try {
    const {
      input,
      goal,
      processor = 'base',
      output_schema,
      task_spec,
      source_policy,
      metadata,
      enable_events,
    } = req.body;

    const effectiveInput = input || goal;
    if (!effectiveInput || !effectiveInput.trim()) {
      return ApiResponse.error(res, 'input is required', 400);
    }

    const result = await parallelTask.createRun({
      input:          effectiveInput.trim(),
      processor,
      output_schema,
      task_spec,
      source_policy,
      metadata,
      enable_events,
      userId: req.user?._id,
    });

    return ApiResponse.created(res, result, 'Task run created');
  } catch (err) {
    console.error('Task create error:', err);
    return ApiResponse.error(res, err.message);
  }
};

exports.getTaskRun = async (req, res) => {
  try {
    const run = await parallelTask.getRun(req.params.id);
    if (!run) return ApiResponse.notFound(res, 'Task run not found');
    return ApiResponse.success(res, run);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.getTaskRunResult = async (req, res) => {
  try {
    const timeout = parseInt(req.query.timeout) || 30;
    const result = await parallelTask.getRunResult(req.params.id, timeout);
    if (!result) return ApiResponse.notFound(res, 'Task run not found');
    return ApiResponse.success(res, result);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.getTaskRunEvents = async (req, res) => {
  try {
    const events = await parallelTask.getRunEvents(req.params.id);
    if (!events) return ApiResponse.notFound(res, 'Task run not found');

    if (req.headers.accept === 'text/event-stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      for (const event of events) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
      res.end();
    } else {
      return ApiResponse.success(res, events);
    }
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.listTaskRuns = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, processor } = req.query;
    const filter = {};
    if (req.user) filter.user = req.user._id;
    if (status) filter.status = status;
    if (processor) filter.processor = processor;

    const { skip, limit: lim } = paginate(null, page, limit);
    const [runs, total] = await Promise.all([
      TaskRun.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .select('run_id input processor status confidence started_at completed_at duration_ms createdAt')
        .lean(),
      TaskRun.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, runs, getPaginationMeta(total, page, lim), 'Task runs retrieved');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

/* ═══════════════════════════════════════════════════════
   FINDALL API
   ═══════════════════════════════════════════════════════ */
exports.createFindAllRun = async (req, res) => {
  try {
    const {
      entity_type,
      objective,
      criteria,
      generator = 'base',
      match_conditions = [],
      match_limit = 10,
      exclude_list = [],
      metadata,
    } = req.body;

    const effectiveObjective = objective || criteria;
    if (!entity_type && !effectiveObjective) {
      return ApiResponse.error(res, 'entity_type and objective are required', 400);
    }

    const result = await parallelFindAll.createRun({
      entity_type:     entity_type || 'entity',
      objective:       effectiveObjective,
      generator,
      match_conditions,
      match_limit,
      exclude_list,
      metadata,
      userId: req.user?._id,
    });

    return ApiResponse.created(res, result, 'FindAll run created');
  } catch (err) {
    console.error('FindAll create error:', err);
    return ApiResponse.error(res, err.message);
  }
};

exports.getFindAllRun = async (req, res) => {
  try {
    const run = await parallelFindAll.getRun(req.params.id);
    if (!run) return ApiResponse.notFound(res, 'FindAll run not found');
    return ApiResponse.success(res, run);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.getFindAllRunResult = async (req, res) => {
  try {
    const result = await parallelFindAll.getRunResult(req.params.id);
    if (!result) return ApiResponse.notFound(res, 'FindAll run not found');
    return ApiResponse.success(res, result);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.cancelFindAllRun = async (req, res) => {
  try {
    const run = await parallelFindAll.cancelRun(req.params.id);
    if (!run) return ApiResponse.notFound(res, 'FindAll run not found');
    return ApiResponse.success(res, { findall_id: run.findall_id, status: run.status }, 'FindAll run cancelled');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.findAllIngest = async (req, res) => {
  try {
    const spec = await parallelFindAll.ingest(req.body);
    return ApiResponse.success(res, spec, 'FindAll spec generated');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

/* ═══════════════════════════════════════════════════════
   CHAT API
   ═══════════════════════════════════════════════════════ */
exports.chatCompletion = async (req, res) => {
  try {
    const { messages, model, web_search_enabled, source_policy, session_id } = req.body;

    if (!messages || !Array.isArray(messages) || !messages.length) {
      return ApiResponse.error(res, 'messages array is required', 400);
    }

    const result = await parallelChat.createCompletion({
      messages,
      model,
      web_search_enabled,
      source_policy,
      session_id,
      userId: req.user?._id,
    });

    return ApiResponse.success(res, result, 'Chat completion created');
  } catch (err) {
    console.error('Chat error:', err);
    return ApiResponse.error(res, err.message);
  }
};

exports.createChatSession = async (req, res) => {
  try {
    const result = await parallelChat.createSession({
      ...req.body,
      userId: req.user?._id,
    });
    return ApiResponse.created(res, result, 'Chat session created');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.getChatSession = async (req, res) => {
  try {
    const session = await parallelChat.getSession(req.params.id);
    if (!session) return ApiResponse.notFound(res, 'Chat session not found');
    return ApiResponse.success(res, session);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.listChatSessions = async (req, res) => {
  try {
    const sessions = await parallelChat.listSessions(
      req.user?._id,
      parseInt(req.query.limit) || 20,
      parseInt(req.query.offset) || 0,
    );
    return ApiResponse.success(res, sessions, 'Chat sessions retrieved');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

/* ═══════════════════════════════════════════════════════
   MONITOR API
   ═══════════════════════════════════════════════════════ */
exports.createWatch = async (req, res) => {
  try {
    const { url, name, objective, frequency, notify_on } = req.body;

    if (!url) return ApiResponse.error(res, 'url is required', 400);
    try { new URL(url); } catch { return ApiResponse.error(res, 'Invalid URL', 400); }

    const result = await parallelMonitor.createWatch({
      url, name, objective, frequency, notify_on,
      userId: req.user?._id,
    });

    return ApiResponse.created(res, result, 'Watch created');
  } catch (err) {
    console.error('Monitor create error:', err);
    return ApiResponse.error(res, err.message);
  }
};

exports.listWatches = async (req, res) => {
  try {
    const result = await parallelMonitor.listWatches(req.user?._id, {
      limit:       parseInt(req.query.limit) || 20,
      offset:      parseInt(req.query.offset) || 0,
      active_only: req.query.active_only === 'true',
    });
    return ApiResponse.success(res, result, 'Watches retrieved');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.getWatch = async (req, res) => {
  try {
    const watch = await parallelMonitor.getWatch(req.params.id);
    if (!watch) return ApiResponse.notFound(res, 'Watch not found');
    return ApiResponse.success(res, watch);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.deleteWatch = async (req, res) => {
  try {
    const deleted = await parallelMonitor.deleteWatch(req.params.id);
    if (!deleted) return ApiResponse.notFound(res, 'Watch not found');
    return ApiResponse.success(res, null, 'Watch deleted');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.triggerCheck = async (req, res) => {
  try {
    const watch = await MonitorWatch.findOne({ watch_id: req.params.id });
    if (!watch) return ApiResponse.notFound(res, 'Watch not found');
    const result = await parallelMonitor.checkWatch(watch._id);
    return ApiResponse.success(res, result, 'Check triggered');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.getWatchChanges = async (req, res) => {
  try {
    const result = await parallelMonitor.getWatchChanges(req.params.id, {
      limit:  parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    });
    if (!result) return ApiResponse.notFound(res, 'Watch not found');
    return ApiResponse.success(res, result, 'Changes retrieved');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.toggleWatch = async (req, res) => {
  try {
    const { active } = req.body;
    const watch = await parallelMonitor.toggleWatch(req.params.id, active !== false);
    if (!watch) return ApiResponse.notFound(res, 'Watch not found');
    return ApiResponse.success(res, { watch_id: watch.watch_id, is_active: watch.is_active }, 'Watch toggled');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

/* ═══════════════════════════════════════════════════════
   SOURCES (admin / ingestion)
   ═══════════════════════════════════════════════════════ */
exports.listSources = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type, search } = req.query;
    const filter = {};
    if (status) filter.crawlStatus = status;
    if (type) filter.type = type;
    if (search) filter.$text = { $search: search };

    const { skip, limit: lim } = paginate(null, page, limit);
    const [sources, total] = await Promise.all([
      Source.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
      Source.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, sources, getPaginationMeta(total, page, lim), 'Sources retrieved');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.addSource = async (req, res) => {
  try {
    const { url, name, type = 'webpage', crawlDepth = 1, tags = [] } = req.body;
    if (!url) return ApiResponse.error(res, 'URL is required', 400);
    try { new URL(url); } catch { return ApiResponse.error(res, 'Invalid URL', 400); }

    const domain = new URL(url).hostname;
    let source = await Source.findOne({ url });
    if (source) return ApiResponse.error(res, 'Source already exists', 409);

    source = await Source.create({
      name: name || domain, url, domain, type,
      crawlDepth: Math.min(crawlDepth, 3), tags,
      addedBy: req.user?._id,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
    });

    ingestWithDepth(url, source._id, {
      depth: Math.min(crawlDepth, 3), maxPages: 20, userId: req.user?._id,
    }).catch(err => console.error(`Ingestion failed for ${url}:`, err.message));

    return ApiResponse.created(res, source, 'Source added and ingestion started');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.getSource = async (req, res) => {
  try {
    const status = await getPipelineStatus(req.params.id);
    if (!status.source) return ApiResponse.notFound(res, 'Source not found');
    return ApiResponse.success(res, status);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.deleteSource = async (req, res) => {
  try {
    const source = await Source.findById(req.params.id);
    if (!source) return ApiResponse.notFound(res, 'Source not found');
    await Promise.all([
      Chunk.deleteMany({ source: source._id }),
      CrawlJob.deleteMany({ source: source._id }),
    ]);
    await source.deleteOne();
    return ApiResponse.success(res, null, 'Source and all associated data deleted');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

exports.recrawlSource = async (req, res) => {
  try {
    const source = await Source.findById(req.params.id);
    if (!source) return ApiResponse.notFound(res, 'Source not found');
    source.crawlStatus = 'pending';
    await source.save();
    ingestWithDepth(source.url, source._id, {
      depth: source.crawlDepth, maxPages: 20, userId: req.user?._id,
    }).catch(err => console.error(`Re-crawl failed for ${source.url}:`, err.message));
    return ApiResponse.success(res, { sourceId: source._id }, 'Re-crawl initiated');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

/* ═══════════════════════════════════════════════════════
   CHUNKS
   ═══════════════════════════════════════════════════════ */
exports.listChunks = async (req, res) => {
  try {
    const { page = 1, limit = 20, source, status, search } = req.query;
    const filter = {};
    if (source) filter.source = source;
    if (status) filter.status = status;
    if (search) filter.$text = { $search: search };

    const { skip, limit: lim } = paginate(null, page, limit);
    const [chunks, total] = await Promise.all([
      Chunk.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip).limit(lim)
        .select('-embedding')
        .populate('source', 'name url domain favicon trustScore')
        .lean(),
      Chunk.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, chunks, getPaginationMeta(total, page, lim), 'Chunks retrieved');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

/* ═══════════════════════════════════════════════════════
   STATS  — platform-wide analytics
   ═══════════════════════════════════════════════════════ */
exports.getStats = async (req, res) => {
  try {
    const [
      totalSources, totalChunks, totalJobs, totalTaskRuns,
      totalFindAllRuns, totalChatSessions, totalMonitorWatches,
      totalSearches, statusBreakdown, recentSearches, topSources,
    ] = await Promise.all([
      Source.countDocuments(),
      Chunk.countDocuments(),
      CrawlJob.countDocuments(),
      TaskRun.countDocuments(),
      FindAllRun.countDocuments(),
      ChatSession.countDocuments(),
      MonitorWatch.countDocuments(),
      SearchLog.countDocuments(),
      Chunk.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      SearchLog.find().sort({ createdAt: -1 }).limit(10).select('query resultCount responseTime searchType createdAt').lean(),
      Source.find().sort({ chunksCount: -1 }).limit(10).select('name domain url chunksCount trustScore favicon crawlStatus').lean(),
    ]);

    const jobStages = await CrawlJob.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 } } }]);
    const avgResponseTime = await SearchLog.aggregate([
      { $group: { _id: null, avg: { $avg: '$responseTime' } } },
    ]);

    return ApiResponse.success(res, {
      overview: {
        totalSources,
        totalChunks,
        totalCrawlJobs: totalJobs,
        totalTaskRuns,
        totalFindAllRuns,
        totalChatSessions,
        totalMonitorWatches,
        totalSearches,
        avgSearchResponseMs: Math.round(avgResponseTime[0]?.avg || 0),
      },
      chunkStatusBreakdown: statusBreakdown,
      crawlJobStages: jobStages,
      recentSearches,
      topSources,
    });
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

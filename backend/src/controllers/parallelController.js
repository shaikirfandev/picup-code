/**
 * parallelController — handles all AI-native search platform endpoints:
 *   POST /search      → hybrid search with ranked chunks + citations
 *   POST /extract     → structured data extraction from a URL
 *   POST /task        → multi-step research agent
 *   POST /findall     → dataset generation across sources
 *   GET  /sources     → list indexed sources
 *   POST /sources     → add new source (triggers ingestion)
 *   GET  /sources/:id → source detail + pipeline status
 *   DELETE /sources/:id → remove source and its chunks
 *   GET  /tasks       → list research tasks
 *   GET  /tasks/:id   → task detail
 *   GET  /stats       → platform-wide statistics
 *   GET  /chunks      → browse indexed chunks
 */

const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');
const { hybridSearch } = require('../services/searchService');
const { extractFromUrl } = require('../services/agentService');
const { runResearchTask } = require('../services/agentService');
const { ingestUrl, ingestWithDepth, getPipelineStatus } = require('../services/ingestPipeline');
const Source = require('../models/Source');
const Chunk = require('../models/Chunk');
const CrawlJob = require('../models/CrawlJob');
const ResearchTask = require('../models/ResearchTask');
const SearchLog = require('../models/SearchLog');

/* ───────────────────────────────────────────────────── */
/*  POST /search                                          */
/* ───────────────────────────────────────────────────── */
exports.search = async (req, res) => {
  try {
    const { query, filters = {}, limit = 20, page = 1, searchType = 'hybrid' } = req.body;

    if (!query || !query.trim()) {
      return ApiResponse.error(res, 'Query is required', 400);
    }

    const results = await hybridSearch(query.trim(), {
      filters,
      limit: Math.min(parseInt(limit) || 20, 100),
      page: parseInt(page) || 1,
      searchType,
      userId: req.user?._id,
      ip: req.ip,
    });

    return ApiResponse.success(res, results, 'Search completed');
  } catch (err) {
    console.error('Search error:', err);
    return ApiResponse.error(res, err.message);
  }
};

/* ───────────────────────────────────────────────────── */
/*  POST /extract                                         */
/* ───────────────────────────────────────────────────── */
exports.extract = async (req, res) => {
  try {
    const { url, schema = {} } = req.body;

    if (!url) {
      return ApiResponse.error(res, 'URL is required', 400);
    }

    // Validate URL
    try { new URL(url); } catch { return ApiResponse.error(res, 'Invalid URL', 400); }

    const result = await extractFromUrl(url, schema);
    return ApiResponse.success(res, result, 'Extraction completed');
  } catch (err) {
    console.error('Extract error:', err);
    return ApiResponse.error(res, err.message);
  }
};

/* ───────────────────────────────────────────────────── */
/*  POST /task                                            */
/* ───────────────────────────────────────────────────── */
exports.createTask = async (req, res) => {
  try {
    const { goal, output_schema, filters, maxResults = 20 } = req.body;

    if (!goal || !goal.trim()) {
      return ApiResponse.error(res, 'Goal is required', 400);
    }

    // Create the task
    const task = await ResearchTask.create({
      taskType: 'task',
      goal: goal.trim(),
      outputSchema: output_schema,
      filters,
      maxResults,
      user: req.user?._id,
    });

    // Run asynchronously
    runResearchTask(task._id).catch((err) => {
      console.error(`Task ${task._id} failed:`, err.message);
    });

    return ApiResponse.created(res, {
      taskId: task._id,
      status: task.status,
      message: 'Task queued. Poll GET /task/:id for status.',
    }, 'Research task created');
  } catch (err) {
    console.error('Task error:', err);
    return ApiResponse.error(res, err.message);
  }
};

/* ───────────────────────────────────────────────────── */
/*  POST /findall                                         */
/* ───────────────────────────────────────────────────── */
exports.findAll = async (req, res) => {
  try {
    const { criteria, schema, maxResults = 50, filters = {} } = req.body;

    if (!criteria || !criteria.trim()) {
      return ApiResponse.error(res, 'Criteria is required', 400);
    }

    // Create as a findall task
    const task = await ResearchTask.create({
      taskType: 'findall',
      goal: criteria.trim(),
      outputSchema: schema,
      filters,
      maxResults: Math.min(maxResults, 200),
      user: req.user?._id,
    });

    // Run asynchronously
    runResearchTask(task._id).catch((err) => {
      console.error(`FindAll ${task._id} failed:`, err.message);
    });

    return ApiResponse.created(res, {
      taskId: task._id,
      status: task.status,
      message: 'FindAll task queued. Poll GET /task/:id for status.',
    }, 'FindAll task created');
  } catch (err) {
    console.error('FindAll error:', err);
    return ApiResponse.error(res, err.message);
  }
};

/* ───────────────────────────────────────────────────── */
/*  GET /tasks                                            */
/* ───────────────────────────────────────────────────── */
exports.listTasks = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, taskType } = req.query;
    const filter = {};
    if (req.user) filter.user = req.user._id;
    if (status) filter.status = status;
    if (taskType) filter.taskType = taskType;

    const { skip, limit: lim } = paginate(null, page, limit);
    const [tasks, total] = await Promise.all([
      ResearchTask.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .select('-steps -result.chunks')
        .lean(),
      ResearchTask.countDocuments(filter),
    ]);

    return ApiResponse.paginated(
      res, tasks, getPaginationMeta(total, page, lim), 'Tasks retrieved'
    );
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

/* ───────────────────────────────────────────────────── */
/*  GET /tasks/:id                                        */
/* ───────────────────────────────────────────────────── */
exports.getTask = async (req, res) => {
  try {
    const task = await ResearchTask.findById(req.params.id).lean();
    if (!task) return ApiResponse.notFound(res, 'Task not found');
    return ApiResponse.success(res, task);
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

/* ───────────────────────────────────────────────────── */
/*  Sources CRUD                                          */
/* ───────────────────────────────────────────────────── */
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

    return ApiResponse.paginated(
      res, sources, getPaginationMeta(total, page, lim), 'Sources retrieved'
    );
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

    // Check if already exists
    let source = await Source.findOne({ url });
    if (source) {
      return ApiResponse.error(res, 'Source already exists', 409);
    }

    source = await Source.create({
      name: name || domain,
      url,
      domain,
      type,
      crawlDepth: Math.min(crawlDepth, 3),
      tags,
      addedBy: req.user?._id,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
    });

    // Trigger ingestion pipeline
    ingestWithDepth(url, source._id, {
      depth: Math.min(crawlDepth, 3),
      maxPages: 20,
      userId: req.user?._id,
    }).catch((err) => {
      console.error(`Ingestion failed for ${url}:`, err.message);
    });

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

    // Delete all chunks and jobs for this source
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

/* ── Re-crawl a source ──────────────────────────────── */
exports.recrawlSource = async (req, res) => {
  try {
    const source = await Source.findById(req.params.id);
    if (!source) return ApiResponse.notFound(res, 'Source not found');

    source.crawlStatus = 'pending';
    await source.save();

    ingestWithDepth(source.url, source._id, {
      depth: source.crawlDepth,
      maxPages: 20,
      userId: req.user?._id,
    }).catch((err) => {
      console.error(`Re-crawl failed for ${source.url}:`, err.message);
    });

    return ApiResponse.success(res, { sourceId: source._id }, 'Re-crawl initiated');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

/* ───────────────────────────────────────────────────── */
/*  GET /chunks                                           */
/* ───────────────────────────────────────────────────── */
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
        .skip(skip)
        .limit(lim)
        .select('-embedding')
        .populate('source', 'name url domain favicon trustScore')
        .lean(),
      Chunk.countDocuments(filter),
    ]);

    return ApiResponse.paginated(
      res, chunks, getPaginationMeta(total, page, lim), 'Chunks retrieved'
    );
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
};

/* ───────────────────────────────────────────────────── */
/*  GET /stats                                            */
/* ───────────────────────────────────────────────────── */
exports.getStats = async (req, res) => {
  try {
    const [
      totalSources,
      totalChunks,
      totalJobs,
      totalTasks,
      totalSearches,
      statusBreakdown,
      recentSearches,
      topSources,
    ] = await Promise.all([
      Source.countDocuments(),
      Chunk.countDocuments(),
      CrawlJob.countDocuments(),
      ResearchTask.countDocuments(),
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
        totalResearchTasks: totalTasks,
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

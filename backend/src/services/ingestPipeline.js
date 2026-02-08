/**
 * IngestPipeline — orchestrates the full crawl → clean → chunk → embed → index
 * pipeline for a single Source or URL.
 *
 * Each stage is idempotent and tracked via CrawlJob.stage.
 */

const Source = require('../models/Source');
const Chunk = require('../models/Chunk');
const CrawlJob = require('../models/CrawlJob');
const { crawlUrl, crawlWithDepth } = require('./crawlerService');
const { cleanHtml, cleanText } = require('./cleaningService');
const { createChunks, contentHash } = require('./chunkingService');
const { embedBatch, EMBEDDING_MODEL, EMBEDDING_DIM } = require('./embeddingService');

/* ── Ingest a single URL ────────────────────────────── */
async function ingestUrl(url, sourceId, options = {}) {
  const { userId, depth = 0 } = options;

  // Create or find Source
  let source;
  if (sourceId) {
    source = await Source.findById(sourceId);
  }
  if (!source) {
    const domain = new URL(url).hostname;
    source = await Source.findOneAndUpdate(
      { url },
      {
        $setOnInsert: {
          name: domain,
          url,
          domain,
          type: 'webpage',
          addedBy: userId,
        },
      },
      { upsert: true, new: true }
    );
  }

  // Create CrawlJob
  const job = await CrawlJob.create({
    source: source._id,
    url,
    depth: 0,
    stage: 'crawling',
    startedAt: new Date(),
    triggeredBy: userId,
  });

  try {
    /* ── Stage 1: Crawl ─────────────────────────────── */
    const crawlResult = await crawlUrl(url);
    job.rawBytes = crawlResult.rawBytes;
    job.statusCode = crawlResult.statusCode;
    job.contentType = crawlResult.contentType;
    job.pagesDiscovered = crawlResult.childLinks.slice(0, 100);
    job.stage = 'cleaning';
    job.progress = 20;
    await job.save();

    /* ── Stage 2: Clean ─────────────────────────────── */
    const isHtml = (crawlResult.contentType || '').includes('html');

    // Cap raw content at 500 KB to prevent OOM on very large pages
    const MAX_CLEAN_INPUT = 500 * 1024;
    let rawInput = crawlResult.rawContent;
    if (rawInput.length > MAX_CLEAN_INPUT) {
      rawInput = rawInput.slice(0, MAX_CLEAN_INPUT);
    }
    // Free original content reference
    crawlResult.rawContent = null;

    const { text, metadata } = isHtml
      ? cleanHtml(rawInput)
      : cleanText(rawInput);
    rawInput = null; // free

    // Don't persist full cleaned text on job to save memory
    job.cleanedBytes = Buffer.byteLength(text, 'utf-8');
    job.pageTitle = metadata.title || metadata.ogTitle || '';
    job.pageAuthor = metadata.author || '';
    job.publishedAt = metadata.publishedAt ? new Date(metadata.publishedAt) : null;
    job.language = metadata.language || 'en';
    job.stage = 'chunking';
    job.progress = 40;
    await job.save();

    // Update source metadata
    source.lastCrawledAt = new Date();
    source.crawlStatus = 'completed';
    source.favicon = source.favicon || `https://www.google.com/s2/favicons?domain=${source.domain}&sz=32`;
    if (!source.description && metadata.description) {
      source.description = metadata.description;
    }
    await source.save();

    /* ── Stage 3: Chunk ─────────────────────────────── */
    const chunkData = createChunks(text, {
      pageTitle: job.pageTitle,
      title: job.pageTitle,
      url,
      domain: source.domain,
      author: job.pageAuthor,
      publishedAt: job.publishedAt,
    });

    // Deduplicate against existing chunks
    const existingHashes = new Set(
      (await Chunk.find({ source: source._id }, 'contentHash').lean())
        .map((c) => c.contentHash)
    );

    const newChunkData = chunkData.filter((c) => !existingHashes.has(c.contentHash));

    job.stage = 'embedding';
    job.progress = 60;
    await job.save();

    /* ── Stage 4: Embed ─────────────────────────────── */
    const texts = newChunkData.map((c) => c.content);
    const embeddings = texts.length > 0 ? await embedBatch(texts) : [];

    job.stage = 'indexing';
    job.progress = 80;
    await job.save();

    /* ── Stage 5: Index (save to DB) ────────────────── */
    const chunkDocs = newChunkData.map((c, i) => ({
      ...c,
      source: source._id,
      sourceUrl: url,
      embedding: embeddings[i] || [],
      embeddingModel: EMBEDDING_MODEL,
      embeddingDim: EMBEDDING_DIM,
      trustScore: source.trustScore,
      confidenceScore: 0.6,
      qualityScore: 0.5,
      language: job.language,
      status: 'indexed',
      processedAt: new Date(),
    }));

    let created = [];
    if (chunkDocs.length > 0) {
      created = await Chunk.insertMany(chunkDocs, { ordered: false }).catch((err) => {
        // Handle duplicate key errors gracefully
        if (err.insertedDocs) return err.insertedDocs;
        console.error('Chunk insert error:', err.message);
        return [];
      });
    }

    /* ── Finalize ───────────────────────────────────── */
    job.chunksCreated = Array.isArray(created) ? created.length : 0;
    job.stage = 'completed';
    job.progress = 100;
    job.completedAt = new Date();
    job.duration = job.completedAt - job.startedAt;
    await job.save();

    // Update source stats
    source.chunksCount = await Chunk.countDocuments({ source: source._id });
    source.pagesCount += 1;
    source.totalBytes += job.rawBytes;
    await source.save();

    return {
      jobId: job._id,
      sourceId: source._id,
      chunksCreated: job.chunksCreated,
      pagesDiscovered: job.pagesDiscovered.length,
      duration: job.duration,
    };

  } catch (err) {
    job.stage = 'failed';
    job.error = err.message;
    job.completedAt = new Date();
    job.duration = job.completedAt - job.startedAt;
    await job.save();

    source.crawlStatus = 'failed';
    source.crawlError = err.message;
    await source.save();

    throw err;
  }
}

/* ── Ingest with depth (multi-page) ─────────────────── */
async function ingestWithDepth(url, sourceId, options = {}) {
  const { depth = 1, maxPages = 20, userId } = options;

  // First ingest the root URL
  const rootResult = await ingestUrl(url, sourceId, { userId });

  if (depth > 0) {
    // Get discovered child URLs from the root crawl job
    const rootJob = await CrawlJob.findById(rootResult.jobId);
    const childUrls = (rootJob?.pagesDiscovered || []).slice(0, maxPages - 1);

    // Ingest each child URL (sequentially to avoid rate limits)
    const childResults = [];
    for (const childUrl of childUrls) {
      try {
        const result = await ingestUrl(childUrl, rootResult.sourceId, { userId, depth: 0 });
        childResults.push(result);
      } catch (err) {
        childResults.push({ url: childUrl, error: err.message });
      }
    }

    return {
      ...rootResult,
      childResults,
      totalPagesIngested: 1 + childResults.filter((r) => !r.error).length,
    };
  }

  return rootResult;
}

/* ── Get pipeline status for a source ───────────────── */
async function getPipelineStatus(sourceId) {
  const source = await Source.findById(sourceId).lean();
  const jobs = await CrawlJob.find({ source: sourceId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const chunkStats = await Chunk.aggregate([
    { $match: { source: source._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalChars: { $sum: '$charCount' },
      },
    },
  ]);

  return {
    source,
    recentJobs: jobs,
    chunkStats,
    totalChunks: await Chunk.countDocuments({ source: sourceId }),
  };
}

module.exports = {
  ingestUrl,
  ingestWithDepth,
  getPipelineStatus,
};

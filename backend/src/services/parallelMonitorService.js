/**
 * parallelMonitorService.js — mirrors the real Parallel.ai Monitor API.
 *
 * POST   /v1beta/monitor/watches       — create watch
 * GET    /v1beta/monitor/watches       — list watches
 * GET    /v1beta/monitor/watches/:id   — get watch
 * DELETE /v1beta/monitor/watches/:id   — delete watch
 * POST   /v1beta/monitor/watches/:id/check — trigger immediate check
 *
 * Periodically checks URLs for changes, detects differences,
 * tracks change history.
 */

const MonitorWatch = require('../models/MonitorWatch');
const crypto = require('crypto');

/* ── Content hashing ─────────────────────────────────── */
function hashContent(content) {
  return crypto.createHash('sha256').update(content || '').digest('hex');
}

/* ── Simple diff summary ─────────────────────────────── */
function computeChangeSummary(oldContent, newContent) {
  if (!oldContent) return 'Initial content captured';
  const oldLines = (oldContent || '').split('\n');
  const newLines = (newContent || '').split('\n');
  const added   = newLines.filter(l => !oldLines.includes(l)).length;
  const removed = oldLines.filter(l => !newLines.includes(l)).length;
  return `${added} lines added, ${removed} lines removed`;
}

/* ── Fetch URL content ───────────────────────────────── */
async function fetchUrlContent(url) {
  try {
    const crawlerService = require('./crawlerService');
    const result = await crawlerService.fetchUrl(url);
    const cleaningService = require('./cleaningService');
    const cleaned = cleaningService.cleanHtml(result.html || result.content || '');
    return {
      content: cleaned.text || cleaned || '',
      title: result.title || '',
      statusCode: result.statusCode || 200,
    };
  } catch (err) {
    // Fallback: try basic HTTP fetch
    try {
      const fetch = (await import('node-fetch')).default;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ParallelMonitor/1.0' },
        timeout: 15000,
      });
      const text = await res.text();
      return {
        content: text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 50000),
        title: '',
        statusCode: res.status,
      };
    } catch (fetchErr) {
      throw new Error(`Failed to fetch ${url}: ${fetchErr.message}`);
    }
  }
}

/* ════════════════════════════════════════════════════════
   PUBLIC: createWatch()
   ════════════════════════════════════════════════════════ */
async function createWatch(params = {}) {
  const {
    url,
    name,
    objective,
    frequency = 'daily',
    notify_on = ['content_changed'],
    userId = null,
  } = params;

  if (!url) throw new Error('url is required');

  // Calculate next check time based on frequency
  const now = new Date();
  const nextCheck = computeNextCheck(now, frequency);

  const watch = await MonitorWatch.create({
    url,
    name: name || new URL(url).hostname,
    objective: objective || 'Track changes',
    frequency,
    notify_on,
    next_check: nextCheck,
    user: userId,
  });

  // Do initial check
  checkWatch(watch._id).catch(err => {
    console.warn(`Initial check for ${watch.watch_id} failed:`, err.message);
  });

  return {
    watch_id:   watch.watch_id,
    url:        watch.url,
    name:       watch.name,
    objective:  watch.objective,
    frequency:  watch.frequency,
    is_active:  watch.is_active,
    next_check: watch.next_check?.toISOString(),
    created_at: watch.createdAt?.toISOString(),
  };
}

/* ── Compute next check time ─────────────────────────── */
function computeNextCheck(from, frequency) {
  const d = new Date(from);
  switch (frequency) {
    case '5min':    d.setMinutes(d.getMinutes() + 5); break;
    case '15min':   d.setMinutes(d.getMinutes() + 15); break;
    case '30min':   d.setMinutes(d.getMinutes() + 30); break;
    case 'hourly':  d.setHours(d.getHours() + 1); break;
    case '6hour':   d.setHours(d.getHours() + 6); break;
    case '12hour':  d.setHours(d.getHours() + 12); break;
    case 'daily':   d.setDate(d.getDate() + 1); break;
    case 'weekly':  d.setDate(d.getDate() + 7); break;
    default:        d.setDate(d.getDate() + 1); break;
  }
  return d;
}

/* ── Check a watch ───────────────────────────────────── */
async function checkWatch(watchDocId) {
  const watch = await MonitorWatch.findById(watchDocId);
  if (!watch || !watch.is_active) return null;

  try {
    const { content, title, statusCode } = await fetchUrlContent(watch.url);
    const newHash = hashContent(content);
    const hasChanged = watch.last_hash && watch.last_hash !== newHash;

    if (hasChanged) {
      const changeSummary = computeChangeSummary(watch.last_content, content);
      watch.changes.push({
        detected_at: new Date(),
        change_type: 'content_changed',
        summary: changeSummary,
        old_hash: watch.last_hash,
        new_hash: newHash,
        diff_stats: {
          chars_added:   Math.max(0, content.length - (watch.last_content || '').length),
          chars_removed: Math.max(0, (watch.last_content || '').length - content.length),
        },
      });
      watch.total_changes++;
    } else if (!watch.last_hash) {
      // First check — record initial state
      watch.changes.push({
        detected_at: new Date(),
        change_type: 'content_changed',
        summary: `Initial content captured (${content.length} chars)`,
        new_hash: newHash,
      });
    }

    watch.last_hash = newHash;
    watch.last_content = content.substring(0, 100000); // Cap stored content
    watch.last_checked = new Date();
    watch.next_check = computeNextCheck(new Date(), watch.frequency);
    watch.total_checks++;

    await watch.save();

    return {
      watch_id:    watch.watch_id,
      url:         watch.url,
      checked_at:  watch.last_checked?.toISOString(),
      has_changed: hasChanged,
      change_type: hasChanged ? 'content_changed' : null,
      next_check:  watch.next_check?.toISOString(),
    };

  } catch (err) {
    // Record error as a change event
    watch.changes.push({
      detected_at: new Date(),
      change_type: 'metadata_changed',
      summary: `Check failed: ${err.message}`,
    });
    watch.last_checked = new Date();
    watch.next_check = computeNextCheck(new Date(), watch.frequency);
    watch.total_checks++;
    await watch.save();

    return {
      watch_id:    watch.watch_id,
      url:         watch.url,
      checked_at:  watch.last_checked?.toISOString(),
      has_changed: false,
      change_type: 'error',
      error:       err.message,
      next_check:  watch.next_check?.toISOString(),
    };
  }
}

/* ── Get watch ───────────────────────────────────────── */
async function getWatch(watchId) {
  return MonitorWatch.findOne({ watch_id: watchId }).lean();
}

/* ── List watches ────────────────────────────────────── */
async function listWatches(userId, { limit = 20, offset = 0, active_only = false } = {}) {
  const query = {};
  if (userId) query.user = userId;
  if (active_only) query.is_active = true;

  const [watches, total] = await Promise.all([
    MonitorWatch.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .select('-last_content -changes')
      .lean(),
    MonitorWatch.countDocuments(query),
  ]);

  return { watches, total, limit, offset };
}

/* ── Get watch changes ───────────────────────────────── */
async function getWatchChanges(watchId, { limit = 50, offset = 0 } = {}) {
  const watch = await MonitorWatch.findOne({ watch_id: watchId })
    .select('watch_id url name changes total_changes')
    .lean();
  if (!watch) return null;

  const changes = (watch.changes || [])
    .sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at))
    .slice(offset, offset + limit);

  return {
    watch_id:      watch.watch_id,
    url:           watch.url,
    name:          watch.name,
    total_changes: watch.total_changes,
    changes,
  };
}

/* ── Delete watch ────────────────────────────────────── */
async function deleteWatch(watchId) {
  const result = await MonitorWatch.findOneAndDelete({ watch_id: watchId });
  return !!result;
}

/* ── Pause/resume watch ──────────────────────────────── */
async function toggleWatch(watchId, active) {
  const watch = await MonitorWatch.findOne({ watch_id: watchId });
  if (!watch) return null;
  watch.is_active = active;
  if (active) {
    watch.next_check = computeNextCheck(new Date(), watch.frequency);
  }
  await watch.save();
  return watch;
}

/* ── Process due checks (called by scheduler/cron) ──── */
async function processDueChecks() {
  const dueWatches = await MonitorWatch.find({
    is_active: true,
    next_check: { $lte: new Date() },
  }).select('_id').lean();

  const results = [];
  for (const w of dueWatches) {
    try {
      const result = await checkWatch(w._id);
      results.push(result);
    } catch (err) {
      results.push({ error: err.message });
    }
  }
  return results;
}

module.exports = {
  createWatch,
  getWatch,
  listWatches,
  getWatchChanges,
  deleteWatch,
  toggleWatch,
  checkWatch,
  processDueChecks,
};

/**
 * Routes for the Parallel AI Search Platform.
 * Base path: /api/parallel
 *
 * Mirrors real Parallel.ai endpoints:
 *   POST   /search
 *   POST   /extract
 *   POST   /tasks/runs
 *   GET    /tasks/runs
 *   GET    /tasks/runs/:id
 *   GET    /tasks/runs/:id/result
 *   GET    /tasks/runs/:id/events
 *   POST   /findall/runs
 *   GET    /findall/runs/:id
 *   GET    /findall/runs/:id/result
 *   POST   /findall/runs/:id/cancel
 *   POST   /findall/ingest
 *   POST   /chat/completions
 *   POST   /chat/sessions
 *   GET    /chat/sessions
 *   GET    /chat/sessions/:id
 *   POST   /monitor/watches
 *   GET    /monitor/watches
 *   GET    /monitor/watches/:id
 *   DELETE /monitor/watches/:id
 *   POST   /monitor/watches/:id/check
 *   POST   /monitor/watches/:id/toggle
 *   GET    /monitor/watches/:id/changes
 *   + Source/Chunk/Stats admin endpoints
 */

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/parallelController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

/* ── Rate limiters ──────────────────────────────────── */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Search rate limit exceeded' },
});

const taskLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Task rate limit exceeded' },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Chat rate limit exceeded' },
});

const ingestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Ingest rate limit exceeded' },
});

/* ═══════════════════════════════════════════════════════
   SEARCH API
   ═══════════════════════════════════════════════════════ */
router.post('/search', searchLimiter, optionalAuth, ctrl.search);

/* ═══════════════════════════════════════════════════════
   EXTRACT API
   ═══════════════════════════════════════════════════════ */
router.post('/extract', taskLimiter, optionalAuth, ctrl.extract);

/* ═══════════════════════════════════════════════════════
   TASK API
   ═══════════════════════════════════════════════════════ */
router.post('/tasks/runs',              taskLimiter, optionalAuth, ctrl.createTaskRun);
router.get('/tasks/runs',               optionalAuth, ctrl.listTaskRuns);
router.get('/tasks/runs/:id',           optionalAuth, ctrl.getTaskRun);
router.get('/tasks/runs/:id/result',    optionalAuth, ctrl.getTaskRunResult);
router.get('/tasks/runs/:id/events',    optionalAuth, ctrl.getTaskRunEvents);

/* ═══════════════════════════════════════════════════════
   FINDALL API
   ═══════════════════════════════════════════════════════ */
router.post('/findall/runs',            taskLimiter, optionalAuth, ctrl.createFindAllRun);
router.get('/findall/runs/:id',         optionalAuth, ctrl.getFindAllRun);
router.get('/findall/runs/:id/result',  optionalAuth, ctrl.getFindAllRunResult);
router.post('/findall/runs/:id/cancel', optionalAuth, ctrl.cancelFindAllRun);
router.post('/findall/ingest',          taskLimiter, optionalAuth, ctrl.findAllIngest);

/* ═══════════════════════════════════════════════════════
   CHAT API
   ═══════════════════════════════════════════════════════ */
router.post('/chat/completions',  chatLimiter, optionalAuth, ctrl.chatCompletion);
router.post('/chat/sessions',     chatLimiter, optionalAuth, ctrl.createChatSession);
router.get('/chat/sessions',      optionalAuth, ctrl.listChatSessions);
router.get('/chat/sessions/:id',  optionalAuth, ctrl.getChatSession);

/* ═══════════════════════════════════════════════════════
   MONITOR API
   ═══════════════════════════════════════════════════════ */
router.post('/monitor/watches',              taskLimiter, optionalAuth, ctrl.createWatch);
router.get('/monitor/watches',               optionalAuth, ctrl.listWatches);
router.get('/monitor/watches/:id',           optionalAuth, ctrl.getWatch);
router.delete('/monitor/watches/:id',        authenticate, ctrl.deleteWatch);
router.post('/monitor/watches/:id/check',    taskLimiter, optionalAuth, ctrl.triggerCheck);
router.post('/monitor/watches/:id/toggle',   optionalAuth, ctrl.toggleWatch);
router.get('/monitor/watches/:id/changes',   optionalAuth, ctrl.getWatchChanges);

/* ═══════════════════════════════════════════════════════
   SOURCES (ingestion admin)
   ═══════════════════════════════════════════════════════ */
router.get('/sources',              optionalAuth, ctrl.listSources);
router.post('/sources',             ingestLimiter, optionalAuth, ctrl.addSource);
router.get('/sources/:id',          optionalAuth, ctrl.getSource);
router.delete('/sources/:id',       authenticate, ctrl.deleteSource);
router.post('/sources/:id/recrawl', ingestLimiter, authenticate, ctrl.recrawlSource);

/* ═══════════════════════════════════════════════════════
   CHUNKS
   ═══════════════════════════════════════════════════════ */
router.get('/chunks', optionalAuth, ctrl.listChunks);

/* ═══════════════════════════════════════════════════════
   STATS / ADMIN
   ═══════════════════════════════════════════════════════ */
router.get('/stats', optionalAuth, ctrl.getStats);

module.exports = router;

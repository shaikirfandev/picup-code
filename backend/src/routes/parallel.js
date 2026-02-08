/**
 * Routes for the Parallel AI Search Platform.
 * Base path: /api/parallel
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

const ingestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Ingest rate limit exceeded' },
});

/* ── Core AI endpoints ──────────────────────────────── */
router.post('/search',   searchLimiter, optionalAuth, ctrl.search);
router.post('/extract',  taskLimiter,   optionalAuth, ctrl.extract);
router.post('/task',     taskLimiter,   optionalAuth, ctrl.createTask);
router.post('/findall',  taskLimiter,   optionalAuth, ctrl.findAll);

/* ── Tasks ──────────────────────────────────────────── */
router.get('/tasks',     optionalAuth, ctrl.listTasks);
router.get('/tasks/:id', optionalAuth, ctrl.getTask);

/* ── Sources (ingestion) ────────────────────────────── */
router.get('/sources',           optionalAuth, ctrl.listSources);
router.post('/sources',          ingestLimiter, optionalAuth, ctrl.addSource);
router.get('/sources/:id',       optionalAuth, ctrl.getSource);
router.delete('/sources/:id',    authenticate,  ctrl.deleteSource);
router.post('/sources/:id/recrawl', ingestLimiter, authenticate, ctrl.recrawlSource);

/* ── Chunks ─────────────────────────────────────────── */
router.get('/chunks',            optionalAuth, ctrl.listChunks);

/* ── Stats / Admin ──────────────────────────────────── */
router.get('/stats',             optionalAuth, ctrl.getStats);

module.exports = router;

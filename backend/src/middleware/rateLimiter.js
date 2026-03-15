const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');

// ── Redis store factory ──────────────────────────────────────────────────────
// Falls back to the default in-memory store when Redis is unavailable.
let redisClient = null;

function getStore(prefix) {
  try {
    if (!redisClient) {
      const { getRedisClient, isRedisConnected } = require('../config/redis');
      if (isRedisConnected()) {
        redisClient = getRedisClient();
      } else {
        // Try to init, but don't crash if it fails
        try { redisClient = getRedisClient(); } catch { /* noop */ }
      }
    }
    if (redisClient) {
      return new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix: `rl:${prefix}:`,
      });
    }
  } catch {
    console.warn('⚠️  rate-limit-redis unavailable, falling back to MemoryStore');
  }
  return undefined; // express-rate-limit defaults to MemoryStore
}

// ── Per-user key generator (falls back to IP for unauthenticated) ────────────
function userOrIpKey(req) {
  return req.user?.id || req.user?._id || req.ip;
}

// ── Shared options ───────────────────────────────────────────────────────────
const sharedOpts = {
  standardHeaders: true,
  legacyHeaders: false,
};

// ── Limiters ─────────────────────────────────────────────────────────────────

// Global rate limiter (IP-based, covers everything)
const globalLimiter = rateLimit({
  ...sharedOpts,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  store: getStore('global'),
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

// Auth endpoints rate limiter (IP-based — user not yet authenticated)
const authLimiter = rateLimit({
  ...sharedOpts,
  windowMs: 15 * 60 * 1000,
  max: 10,
  store: getStore('auth'),
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
});

// AI generation rate limiter (per-user)
const aiLimiter = rateLimit({
  ...sharedOpts,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: userOrIpKey,
  store: getStore('ai'),
  message: {
    success: false,
    message: 'AI generation rate limit exceeded. Please try again later.',
  },
});

// Upload rate limiter (per-user)
const uploadLimiter = rateLimit({
  ...sharedOpts,
  windowMs: 60 * 60 * 1000,
  max: 50,
  keyGenerator: userOrIpKey,
  store: getStore('upload'),
  message: {
    success: false,
    message: 'Upload rate limit exceeded. Please try again later.',
  },
});

// Search rate limiter (per-user)
const searchLimiter = rateLimit({
  ...sharedOpts,
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: userOrIpKey,
  store: getStore('search'),
  message: {
    success: false,
    message: 'Too many search requests. Please slow down.',
  },
});

// Report rate limiter — prevent report abuse (per-user)
const reportLimiter = rateLimit({
  ...sharedOpts,
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: userOrIpKey,
  store: getStore('report'),
  message: {
    success: false,
    message: 'Too many reports submitted. Please try again later.',
  },
});

// Wallet / payments rate limiter (per-user)
const walletLimiter = rateLimit({
  ...sharedOpts,
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: userOrIpKey,
  store: getStore('wallet'),
  message: {
    success: false,
    message: 'Too many wallet requests. Please try again later.',
  },
});

// Admin rate limiter (per-user, generous)
const adminLimiter = rateLimit({
  ...sharedOpts,
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: userOrIpKey,
  store: getStore('admin'),
  message: {
    success: false,
    message: 'Too many admin requests. Please try again later.',
  },
});

// Notifications rate limiter (per-user)
const notificationsLimiter = rateLimit({
  ...sharedOpts,
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: userOrIpKey,
  store: getStore('notif'),
  message: {
    success: false,
    message: 'Too many notification requests. Please slow down.',
  },
});

module.exports = {
  globalLimiter,
  authLimiter,
  aiLimiter,
  uploadLimiter,
  searchLimiter,
  reportLimiter,
  walletLimiter,
  adminLimiter,
  notificationsLimiter,
};

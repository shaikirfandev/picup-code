const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');

// ── Redis client (lazy init) ────────────────────────────────────────────────
let redisClient = null;

// ✅ Detect real Redis (ioredis / node-redis)
function isRealRedis(client) {
  return (
    client &&
    (typeof client.call === 'function' || // ioredis
      typeof client.sendCommand === 'function') // node-redis
  );
}

// ── Store factory ───────────────────────────────────────────────────────────
function getStore(prefix) {
  try {
    if (!redisClient) {
      const { getRedisClient } = require('../config/redis');
      redisClient = getRedisClient();

      console.log(
        '🔍 Redis detected methods:',
        Object.keys(redisClient || {}).slice(0, 10)
      );
    }

    // ❌ If NOT real Redis → fallback to MemoryStore
    if (!isRealRedis(redisClient)) {
      console.warn('⚠️ Using in-memory rate limiter (dev mode)');
      return undefined;
    }

    // ✅ Real Redis → use RedisStore
    return new RedisStore({
      sendCommand: (...args) => {
        try {
          // ioredis
          if (typeof redisClient.call === 'function') {
            return redisClient.call(...args);
          }

          // node-redis v4
          if (typeof redisClient.sendCommand === 'function') {
            return redisClient.sendCommand(args);
          }

          throw new Error('Unsupported Redis client');
        } catch (err) {
          console.error('❌ Redis command failed:', err.message);
          throw err;
        }
      },
      prefix: `rl:${prefix}:`,
    });
  } catch (err) {
    console.warn('⚠️ Redis unavailable → fallback MemoryStore:', err.message);
  }

  return undefined; // fallback to default MemoryStore
}

// ── Key generator ───────────────────────────────────────────────────────────
function userOrIpKey(req) {
  return req.user?.id || req.user?._id || req.ip;
}

// ── Shared config ───────────────────────────────────────────────────────────
const sharedOpts = {
  standardHeaders: true,
  legacyHeaders: false,
};

// ── LIMITERS ────────────────────────────────────────────────────────────────

// 🌍 Global limiter
const globalLimiter = rateLimit({
  ...sharedOpts,
  windowMs: 15 * 60 * 1000,
  max: 1000,
  store: getStore('global'),
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

// 🔐 Auth limiter
const authLimiter = rateLimit({
  ...sharedOpts,
  windowMs: 15 * 60 * 1000,
  max: 30,
  store: getStore('auth'),
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
});

// 🤖 AI limiter
const aiLimiter = rateLimit({
  ...sharedOpts,
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: userOrIpKey,
  store: getStore('ai'),
  message: {
    success: false,
    message: 'AI generation rate limit exceeded.',
  },
});

// 📤 Upload limiter
const uploadLimiter = rateLimit({
  ...sharedOpts,
  windowMs: 60 * 60 * 1000,
  max: 50,
  keyGenerator: userOrIpKey,
  store: getStore('upload'),
  message: {
    success: false,
    message: 'Upload rate limit exceeded.',
  },
});

// 🔎 Search limiter
const searchLimiter = rateLimit({
  ...sharedOpts,
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: userOrIpKey,
  store: getStore('search'),
  message: {
    success: false,
    message: 'Too many search requests.',
  },
});

// 🚨 Report limiter
const reportLimiter = rateLimit({
  ...sharedOpts,
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: userOrIpKey,
  store: getStore('report'),
  message: {
    success: false,
    message: 'Too many reports submitted.',
  },
});

// 💰 Wallet limiter
const walletLimiter = rateLimit({
  ...sharedOpts,
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: userOrIpKey,
  store: getStore('wallet'),
  message: {
    success: false,
    message: 'Too many wallet requests.',
  },
});

// 🛠 Admin limiter
const adminLimiter = rateLimit({
  ...sharedOpts,
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: userOrIpKey,
  store: getStore('admin'),
  message: {
    success: false,
    message: 'Too many admin requests.',
  },
});

// 🔔 Notifications limiter
const notificationsLimiter = rateLimit({
  ...sharedOpts,
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: userOrIpKey,
  store: getStore('notif'),
  message: {
    success: false,
    message: 'Too many notification requests.',
  },
});

// ── Export ──────────────────────────────────────────────────────────────────
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
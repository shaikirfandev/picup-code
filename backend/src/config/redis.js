/**
 * Redis Client Configuration
 * Shared Redis connection for caching, real-time counters, and event buffering.
 */
const Redis = require('ioredis');

let redisClient = null;
let isConnected = false;

function getRedisClient() {
  if (redisClient && isConnected) return redisClient;

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
    reconnectOnError(err) {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED'];
      return targetErrors.some((e) => err.message.includes(e));
    },
    lazyConnect: false,
    enableReadyCheck: true,
    connectTimeout: 10000,
  });

  redisClient.on('connect', () => {
    isConnected = true;
    console.log('🔴 Redis connected');
  });

  redisClient.on('error', (err) => {
    isConnected = false;
    console.error('Redis error:', err.message);
  });

  redisClient.on('close', () => {
    isConnected = false;
  });

  return redisClient;
}

function isRedisConnected() {
  return isConnected && redisClient && redisClient.status === 'ready';
}

/**
 * Safe Redis operations — fallback gracefully if Redis is down.
 */
const safeRedis = {
  async get(key) {
    if (!isRedisConnected()) return null;
    try { return await redisClient.get(key); } catch { return null; }
  },
  async set(key, value, ...args) {
    if (!isRedisConnected()) return null;
    try { return await redisClient.set(key, value, ...args); } catch { return null; }
  },
  async incr(key) {
    if (!isRedisConnected()) return null;
    try { return await redisClient.incr(key); } catch { return null; }
  },
  async incrby(key, amount) {
    if (!isRedisConnected()) return null;
    try { return await redisClient.incrby(key, amount); } catch { return null; }
  },
  async expire(key, seconds) {
    if (!isRedisConnected()) return null;
    try { return await redisClient.expire(key, seconds); } catch { return null; }
  },
  async del(key) {
    if (!isRedisConnected()) return null;
    try { return await redisClient.del(key); } catch { return null; }
  },
  async lpush(key, ...values) {
    if (!isRedisConnected()) return null;
    try { return await redisClient.lpush(key, ...values); } catch { return null; }
  },
  async lrange(key, start, stop) {
    if (!isRedisConnected()) return [];
    try { return await redisClient.lrange(key, start, stop); } catch { return []; }
  },
  async ltrim(key, start, stop) {
    if (!isRedisConnected()) return null;
    try { return await redisClient.ltrim(key, start, stop); } catch { return null; }
  },
  async llen(key) {
    if (!isRedisConnected()) return 0;
    try { return await redisClient.llen(key); } catch { return 0; }
  },
  async pfadd(key, ...values) {
    if (!isRedisConnected()) return null;
    try { return await redisClient.pfadd(key, ...values); } catch { return null; }
  },
  async pfcount(key) {
    if (!isRedisConnected()) return 0;
    try { return await redisClient.pfcount(key); } catch { return 0; }
  },
  async hset(key, field, value) {
    if (!isRedisConnected()) return null;
    try { return await redisClient.hset(key, field, value); } catch { return null; }
  },
  async hincrby(key, field, amount) {
    if (!isRedisConnected()) return null;
    try { return await redisClient.hincrby(key, field, amount); } catch { return null; }
  },
  async hgetall(key) {
    if (!isRedisConnected()) return {};
    try { return await redisClient.hgetall(key); } catch { return {}; }
  },
  async sadd(key, ...members) {
    if (!isRedisConnected()) return null;
    try { return await redisClient.sadd(key, ...members); } catch { return null; }
  },
  async sismember(key, member) {
    if (!isRedisConnected()) return 0;
    try { return await redisClient.sismember(key, member); } catch { return 0; }
  },
  async scard(key) {
    if (!isRedisConnected()) return 0;
    try { return await redisClient.scard(key); } catch { return 0; }
  },
  async pipeline() {
    if (!isRedisConnected()) return null;
    try { return redisClient.pipeline(); } catch { return null; }
  },
};

module.exports = { getRedisClient, isRedisConnected, safeRedis };

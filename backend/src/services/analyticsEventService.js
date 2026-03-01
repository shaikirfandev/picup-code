/**
 * Analytics Event Service
 * 
 * Handles event ingestion with Redis buffering for high throughput.
 * Events are buffered in Redis and batch-written to MongoDB every 60 seconds.
 * Real-time counters are maintained in Redis for live dashboard updates.
 */
const PostEvent = require('../models/PostEvent');
const AffiliateClick = require('../models/AffiliateClick');
const Post = require('../models/Post');
const { safeRedis, isRedisConnected } = require('../config/redis');
const { v4: uuidv4 } = require('uuid');

// ── Redis Key Prefixes ──────────────────────────────────────────────────────
const KEYS = {
  EVENT_BUFFER: 'analytics:event_buffer',
  REALTIME_POST: (postId) => `analytics:rt:post:${postId}`,
  REALTIME_CREATOR: (userId) => `analytics:rt:creator:${userId}`,
  UNIQUE_VIEWS: (postId, date) => `analytics:uv:${postId}:${date}`,
  SESSION_DEDUP: (postId, sessionId) => `analytics:dedup:${postId}:${sessionId}`,
  LIVE_VIEWERS: (postId) => `analytics:live:${postId}`,
  DAILY_COUNTER: (ownerId, metric, date) => `analytics:daily:${ownerId}:${metric}:${date}`,
  AFFILIATE_BUFFER: 'analytics:affiliate_buffer',
};

// ── Bot Detection ────────────────────────────────────────────────────────────
const BOT_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /slurp/i, /mediapartners/i,
  /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
  /whatsapp/i, /telegrambot/i, /discordbot/i, /googlebot/i,
  /bingbot/i, /yandex/i, /baidu/i, /duckduckbot/i,
];

function isBot(userAgent) {
  if (!userAgent) return false;
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

// ── Device Detection ────────────────────────────────────────────────────────
function detectDevice(userAgent) {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/.test(ua)) return 'mobile';
  if (/windows|macintosh|linux|cros/.test(ua)) return 'desktop';
  return 'unknown';
}

function detectBrowser(userAgent) {
  if (!userAgent) return 'unknown';
  if (/edg/i.test(userAgent)) return 'Edge';
  if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'Safari';
  if (/opera|opr/i.test(userAgent)) return 'Opera';
  return 'unknown';
}

function detectOS(userAgent) {
  if (!userAgent) return 'unknown';
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/macintosh|mac os/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
  return 'unknown';
}

// ── Get today's date string ─────────────────────────────────────────────────
function getDateStr(date = new Date()) {
  return date.toISOString().split('T')[0];
}

// ── Track Event ─────────────────────────────────────────────────────────────
/**
 * Track a post interaction event.
 * Buffers in Redis for batch write to MongoDB.
 * Updates real-time counters immediately.
 * 
 * @param {Object} params
 * @param {string} params.postId
 * @param {string} params.ownerId - Post owner user ID
 * @param {string} params.viewerId - User performing the action (null for anonymous)
 * @param {string} params.eventType - view|like|unlike|share|click|save|unsave|comment
 * @param {Object} params.req - Express request object for metadata extraction
 * @param {Object} [params.metadata] - Additional metadata
 */
async function trackEvent({
  postId,
  ownerId,
  viewerId = null,
  eventType,
  req,
  metadata = {},
}) {
  try {
    const userAgent = req?.headers?.['user-agent'] || '';
    const ip = req?.ip || req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || '';
    const sessionId = req?.headers?.['x-session-id'] || req?.cookies?.sessionId || metadata.sessionId || uuidv4();
    const referrer = req?.headers?.['x-referrer-source'] || metadata.referrer || 'unknown';

    // Bot detection
    if (isBot(userAgent)) {
      return { success: true, filtered: true, reason: 'bot' };
    }

    const dateStr = getDateStr();
    const deviceType = detectDevice(userAgent);

    // ── View deduplication (same session + post within 30 minutes) ──
    if (eventType === 'view') {
      const dedupKey = KEYS.SESSION_DEDUP(postId, sessionId);
      if (isRedisConnected()) {
        const exists = await safeRedis.get(dedupKey);
        if (exists) {
          return { success: true, filtered: true, reason: 'duplicate_view' };
        }
        await safeRedis.set(dedupKey, '1', 'EX', 1800); // 30 min dedup window
      }
    }

    // ── Build event object ──
    const event = {
      postId,
      ownerId,
      viewerId,
      eventType,
      sessionId,
      ipAddress: ip,
      deviceType,
      browser: detectBrowser(userAgent),
      os: detectOS(userAgent),
      country: metadata.country || null,
      city: metadata.city || null,
      referrer,
      metadata: {
        ...metadata,
        userAgent: userAgent.substring(0, 200),
      },
      watchDuration: metadata.watchDuration || null,
      completionRate: metadata.completionRate || null,
      affiliateUrl: metadata.affiliateUrl || null,
      isBot: false,
      createdAt: new Date(),
    };

    // ── Buffer event in Redis ──
    if (isRedisConnected()) {
      await safeRedis.lpush(KEYS.EVENT_BUFFER, JSON.stringify(event));

      // ── Update real-time counters ──
      const pipe = await safeRedis.pipeline();
      if (pipe) {
        const rtPostKey = KEYS.REALTIME_POST(postId);
        const rtCreatorKey = KEYS.REALTIME_CREATOR(ownerId);

        pipe.hincrby(rtPostKey, eventType, 1);
        pipe.hincrby(rtPostKey, 'total', 1);
        pipe.expire(rtPostKey, 86400); // 24h TTL

        pipe.hincrby(rtCreatorKey, eventType, 1);
        pipe.hincrby(rtCreatorKey, 'total', 1);
        pipe.expire(rtCreatorKey, 86400);

        // Daily counter
        const dailyKey = KEYS.DAILY_COUNTER(ownerId, eventType, dateStr);
        pipe.incr(dailyKey);
        pipe.expire(dailyKey, 172800); // 48h TTL

        // Unique views tracking with HyperLogLog
        if (eventType === 'view') {
          const uvKey = KEYS.UNIQUE_VIEWS(postId, dateStr);
          pipe.pfadd(uvKey, viewerId || sessionId);
          pipe.expire(uvKey, 172800);

          // Live viewers set (expires quickly)
          const liveKey = KEYS.LIVE_VIEWERS(postId);
          pipe.sadd(liveKey, viewerId || sessionId);
          pipe.expire(liveKey, 60); // 1 min live window
        }

        await pipe.exec();
      }
    } else {
      // Fallback: direct write to MongoDB
      await PostEvent.create(event);
    }

    return { success: true, sessionId };
  } catch (error) {
    console.error('Analytics trackEvent error:', error.message);
    // Non-blocking — don't fail the request
    return { success: false, error: error.message };
  }
}

// ── Track Affiliate Click ────────────────────────────────────────────────────
async function trackAffiliateClick({
  postId,
  ownerId,
  clickerId = null,
  productUrl,
  req,
  metadata = {},
}) {
  try {
    const userAgent = req?.headers?.['user-agent'] || '';
    const ip = req?.ip || req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || '';
    const sessionId = req?.headers?.['x-session-id'] || metadata.sessionId || uuidv4();

    if (isBot(userAgent)) {
      return { success: true, filtered: true, reason: 'bot' };
    }

    // ── Fraud detection: excessive clicks from same session ──
    let isSuspicious = false;
    let suspicionReason = null;
    if (isRedisConnected()) {
      const clickCountKey = `analytics:aff_clicks:${postId}:${sessionId}`;
      const clickCount = await safeRedis.incr(clickCountKey);
      await safeRedis.expire(clickCountKey, 3600);
      if (clickCount > 10) {
        isSuspicious = true;
        suspicionReason = 'excessive_clicks_same_session';
      }
    }

    const clickData = {
      postId,
      ownerId,
      clickerId,
      productUrl,
      sessionId,
      ipAddress: ip,
      deviceType: detectDevice(userAgent),
      browser: detectBrowser(userAgent),
      os: detectOS(userAgent),
      country: metadata.country || null,
      city: metadata.city || null,
      referrer: metadata.referrer || 'unknown',
      isBot: false,
      isSuspicious,
      suspicionReason,
      createdAt: new Date(),
    };

    if (isRedisConnected()) {
      await safeRedis.lpush(KEYS.AFFILIATE_BUFFER, JSON.stringify(clickData));
    } else {
      await AffiliateClick.create(clickData);
    }

    // Also track as a regular click event
    await trackEvent({
      postId,
      ownerId,
      viewerId: clickerId,
      eventType: 'click',
      req,
      metadata: { ...metadata, affiliateUrl: productUrl },
    });

    return { success: true };
  } catch (error) {
    console.error('Analytics trackAffiliateClick error:', error.message);
    return { success: false, error: error.message };
  }
}

// ── Flush Event Buffer to MongoDB ────────────────────────────────────────────
/**
 * Batch write buffered events from Redis to MongoDB.
 * Called by background worker every 60 seconds.
 */
async function flushEventBuffer() {
  if (!isRedisConnected()) return { flushed: 0 };

  try {
    // Get all buffered events
    const bufferLen = await safeRedis.llen(KEYS.EVENT_BUFFER);
    if (bufferLen === 0) return { flushed: 0 };

    // Process in batches of 500
    const batchSize = Math.min(bufferLen, 500);
    const rawEvents = await safeRedis.lrange(KEYS.EVENT_BUFFER, -batchSize, -1);
    await safeRedis.ltrim(KEYS.EVENT_BUFFER, 0, -batchSize - 1);

    if (rawEvents.length === 0) return { flushed: 0 };

    const events = rawEvents
      .map((raw) => {
        try { return JSON.parse(raw); } catch { return null; }
      })
      .filter(Boolean);

    if (events.length > 0) {
      await PostEvent.insertMany(events, { ordered: false }).catch((err) => {
        // Some duplicates may fail — that's OK
        if (err.code !== 11000) console.error('Flush events error:', err.message);
      });
    }

    return { flushed: events.length };
  } catch (error) {
    console.error('flushEventBuffer error:', error.message);
    return { flushed: 0, error: error.message };
  }
}

// ── Flush Affiliate Buffer ──────────────────────────────────────────────────
async function flushAffiliateBuffer() {
  if (!isRedisConnected()) return { flushed: 0 };

  try {
    const bufferLen = await safeRedis.llen(KEYS.AFFILIATE_BUFFER);
    if (bufferLen === 0) return { flushed: 0 };

    const batchSize = Math.min(bufferLen, 200);
    const rawClicks = await safeRedis.lrange(KEYS.AFFILIATE_BUFFER, -batchSize, -1);
    await safeRedis.ltrim(KEYS.AFFILIATE_BUFFER, 0, -batchSize - 1);

    const clicks = rawClicks
      .map((raw) => { try { return JSON.parse(raw); } catch { return null; } })
      .filter(Boolean);

    if (clicks.length > 0) {
      await AffiliateClick.insertMany(clicks, { ordered: false }).catch((err) => {
        if (err.code !== 11000) console.error('Flush affiliate error:', err.message);
      });
    }

    return { flushed: clicks.length };
  } catch (error) {
    console.error('flushAffiliateBuffer error:', error.message);
    return { flushed: 0, error: error.message };
  }
}

// ── Get Real-time Counters ──────────────────────────────────────────────────
async function getRealtimePostCounters(postId) {
  const data = await safeRedis.hgetall(KEYS.REALTIME_POST(postId));
  return {
    views: parseInt(data.view || '0', 10),
    likes: parseInt(data.like || '0', 10),
    shares: parseInt(data.share || '0', 10),
    clicks: parseInt(data.click || '0', 10),
    saves: parseInt(data.save || '0', 10),
    comments: parseInt(data.comment || '0', 10),
    total: parseInt(data.total || '0', 10),
  };
}

async function getRealtimeCreatorCounters(userId) {
  const data = await safeRedis.hgetall(KEYS.REALTIME_CREATOR(userId));
  return {
    views: parseInt(data.view || '0', 10),
    likes: parseInt(data.like || '0', 10),
    shares: parseInt(data.share || '0', 10),
    clicks: parseInt(data.click || '0', 10),
    saves: parseInt(data.save || '0', 10),
    comments: parseInt(data.comment || '0', 10),
    total: parseInt(data.total || '0', 10),
  };
}

async function getLiveViewerCount(postId) {
  return await safeRedis.scard(KEYS.LIVE_VIEWERS(postId));
}

module.exports = {
  trackEvent,
  trackAffiliateClick,
  flushEventBuffer,
  flushAffiliateBuffer,
  getRealtimePostCounters,
  getRealtimeCreatorCounters,
  getLiveViewerCount,
  KEYS,
  getDateStr,
  detectDevice,
  detectBrowser,
  detectOS,
  isBot,
};

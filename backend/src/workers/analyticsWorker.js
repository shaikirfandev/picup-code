/**
 * Analytics Background Worker
 * 
 * Handles periodic tasks:
 * 1. Flush Redis event buffer to MongoDB (every 60s)
 * 2. Flush affiliate click buffer (every 60s)
 * 3. Compute daily aggregations (at midnight)
 * 4. Optional: use Bull queue for heavy processing
 * 
 * Designed to be resilient — failures are logged but don't crash the server.
 */
const {
  flushEventBuffer,
  flushAffiliateBuffer,
} = require('../services/analyticsEventService');

const {
  runDailyAggregation,
  backfillAggregations,
} = require('../services/analyticsAggregationService');

let flushInterval = null;
let aggregationInterval = null;
let isRunning = false;

/**
 * Start all analytics background workers.
 * Call this once on server startup.
 */
function startAnalyticsWorkers() {
  if (isRunning) return;
  isRunning = true;

  console.log('🔧 Starting analytics background workers...');

  // ── 1. Event buffer flush — every 5 seconds (batched for efficiency) ──
  flushInterval = setInterval(async () => {
    try {
      const [eventResult, affiliateResult] = await Promise.all([
        flushEventBuffer(),
        flushAffiliateBuffer(),
      ]);

      if (eventResult.flushed > 0 || affiliateResult.flushed > 0) {
        console.log(`📤 Flushed: ${eventResult.flushed} events, ${affiliateResult.flushed} affiliate clicks`);
      }
    } catch (error) {
      console.error('Worker flush error:', error.message);
    }
  }, 5 * 1000); // 5 seconds — fast enough to feel instant, batched to save DB resources

  // ── 2. Daily aggregation — check every 5 minutes, run at midnight ──
  aggregationInterval = setInterval(async () => {
    const now = new Date();
    // Run at 00:05 (5 minutes past midnight to ensure all events are flushed)
    if (now.getHours() === 0 && now.getMinutes() >= 5 && now.getMinutes() < 10) {
      console.log('🌙 Running nightly analytics aggregation...');
      try {
        // Flush remaining events first
        await flushEventBuffer();
        await flushAffiliateBuffer();

        // Run aggregation for yesterday
        await runDailyAggregation();
      } catch (error) {
        console.error('Nightly aggregation error:', error.message);
      }
    }
  }, 5 * 60 * 1000); // Check every 5 minutes

  // ── 3. Initial aggregation on startup (for yesterday if not done) ──
  setTimeout(async () => {
    try {
      console.log('📊 Running startup analytics aggregation...');
      await runDailyAggregation(); // defaults to yesterday
    } catch (error) {
      console.error('Startup aggregation error:', error.message);
    }
  }, 10000); // 10 second delay to let DB connect

  console.log('✅ Analytics workers started');
}

/**
 * Stop all workers gracefully.
 */
function stopAnalyticsWorkers() {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
  if (aggregationInterval) {
    clearInterval(aggregationInterval);
    aggregationInterval = null;
  }
  isRunning = false;
  console.log('🛑 Analytics workers stopped');
}

/**
 * Manually trigger aggregation (admin use).
 */
async function triggerManualAggregation(dateStr) {
  console.log(`🔧 Manual aggregation triggered for ${dateStr || 'yesterday'}`);
  await flushEventBuffer();
  await flushAffiliateBuffer();
  return await runDailyAggregation(dateStr);
}

/**
 * Manually trigger backfill (admin use).
 */
async function triggerBackfill(days = 30) {
  console.log(`🔧 Backfill triggered for ${days} days`);
  return await backfillAggregations(days);
}

module.exports = {
  startAnalyticsWorkers,
  stopAnalyticsWorkers,
  triggerManualAggregation,
  triggerBackfill,
};

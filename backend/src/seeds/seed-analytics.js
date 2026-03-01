/**
 * Seed script for Creator Analytics demo data.
 * Generates PostEvent, AffiliateClick, PostAnalyticsDaily, and CreatorAnalyticsSnapshot
 * records for existing users and posts.
 *
 * Usage: node src/seeds/seed-analytics.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const PostEvent = require('../models/PostEvent');
const PostAnalyticsDaily = require('../models/PostAnalyticsDaily');
const AffiliateClick = require('../models/AffiliateClick');
const CreatorAnalyticsSnapshot = require('../models/CreatorAnalyticsSnapshot');
const User = require('../models/User');
const Post = require('../models/Post');

// ── Helpers ────────────────────────────────────────────────────────────────
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const chance = (pct) => Math.random() * 100 < pct;

const DEVICES = ['desktop', 'mobile', 'tablet'];
const BROWSERS = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Samsung Internet'];
const OS_LIST = ['Windows', 'macOS', 'iOS', 'Android', 'Linux'];
const COUNTRIES = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IN', 'BR', 'JP', 'PH', 'NG', 'MX', 'KR', 'NL'];
const CITIES = ['New York', 'London', 'Toronto', 'Sydney', 'Berlin', 'Paris', 'Mumbai', 'São Paulo', 'Tokyo', 'Manila'];
const REFERRERS = ['home_feed', 'search', 'profile', 'external', 'direct', 'board', 'share'];
const EVENT_TYPES = ['view', 'like', 'share', 'click', 'save', 'comment'];
const AFFILIATE_URLS = [
  'https://amazon.com/dp/B09V3KXJPB',
  'https://amazon.com/dp/B0BSHF7WHH',
  'https://etsy.com/listing/1234567890',
  'https://shopify.com/products/cool-gadget',
  'https://aliexpress.com/item/1005004',
];

function dateStr(d) {
  return d.toISOString().split('T')[0];
}

function randomDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - rand(0, daysAgo));
  d.setHours(rand(0, 23), rand(0, 59), rand(0, 59));
  return d;
}

// ── Main seeder ────────────────────────────────────────────────────────────
async function seedAnalytics() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get existing users & posts
    const users = await User.find({}).limit(20).lean();
    const posts = await Post.find({}).limit(100).lean();

    if (users.length === 0 || posts.length === 0) {
      console.error('❌  No users or posts found. Run the main seed first: node src/seeds/seed.js');
      process.exit(1);
    }

    console.log(`Found ${users.length} users and ${posts.length} posts`);

    // Clear old analytics data
    await Promise.all([
      PostEvent.deleteMany({}),
      PostAnalyticsDaily.deleteMany({}),
      AffiliateClick.deleteMany({}),
      CreatorAnalyticsSnapshot.deleteMany({}),
    ]);
    console.log('Cleared existing analytics data');

    const DAYS_BACK = 60;

    // ── 1. Generate PostEvents ─────────────────────────────────────────
    console.log('Generating PostEvents...');
    const events = [];
    for (const post of posts) {
      const eventCount = rand(50, 500);
      for (let i = 0; i < eventCount; i++) {
        const viewer = chance(70) ? pick(users) : null;
        const evtType = pick(EVENT_TYPES);
        const device = pick(DEVICES);
        events.push({
          postId: post._id,
          ownerId: post.user || post.author,
          viewerId: viewer?._id || null,
          eventType: evtType === 'view' ? 'view' : evtType,
          sessionId: new mongoose.Types.ObjectId().toString(),
          deviceType: device,
          browser: pick(BROWSERS),
          os: pick(OS_LIST),
          country: pick(COUNTRIES),
          city: pick(CITIES),
          referrer: pick(REFERRERS),
          isBot: chance(2),
          watchDuration: evtType === 'view' ? rand(1, 120) : undefined,
          completionRate: evtType === 'view' ? Math.random() : undefined,
          createdAt: randomDate(DAYS_BACK),
        });
      }
    }

    // Batch insert in chunks
    const CHUNK = 5000;
    for (let i = 0; i < events.length; i += CHUNK) {
      await PostEvent.insertMany(events.slice(i, i + CHUNK), { ordered: false });
      process.stdout.write(`\r  PostEvents: ${Math.min(i + CHUNK, events.length)}/${events.length}`);
    }
    console.log(`\n✅  Inserted ${events.length} PostEvents`);

    // ── 2. Generate AffiliateClicks ────────────────────────────────────
    console.log('Generating AffiliateClicks...');
    const affiliateClicks = [];
    for (const post of posts.slice(0, 30)) {
      const clickCount = rand(5, 50);
      for (let i = 0; i < clickCount; i++) {
        const clicker = chance(60) ? pick(users) : null;
        affiliateClicks.push({
          postId: post._id,
          ownerId: post.user || post.author,
          clickerId: clicker?._id || null,
          productUrl: pick(AFFILIATE_URLS),
          sessionId: new mongoose.Types.ObjectId().toString(),
          ip: `${rand(1, 255)}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`,
          device: { type: pick(DEVICES), browser: pick(BROWSERS), os: pick(OS_LIST) },
          geo: { country: pick(COUNTRIES), city: pick(CITIES) },
          isBot: chance(3),
          isSuspicious: chance(5),
          converted: chance(4),
          conversionValue: chance(4) ? rand(10, 200) : 0,
          createdAt: randomDate(DAYS_BACK),
        });
      }
    }
    await AffiliateClick.insertMany(affiliateClicks, { ordered: false });
    console.log(`✅  Inserted ${affiliateClicks.length} AffiliateClicks`);

    // ── 3. Aggregate PostAnalyticsDaily ────────────────────────────────
    console.log('Generating PostAnalyticsDaily...');
    const dailyDocs = [];
    for (const post of posts) {
      for (let d = 0; d < DAYS_BACK; d++) {
        if (chance(30)) continue; // skip some days
        const date = new Date();
        date.setDate(date.getDate() - d);
        const ds = dateStr(date);
        const impressions = rand(10, 800);
        const uniqueViews = Math.min(rand(5, impressions), impressions);
        const likes = rand(0, Math.floor(impressions * 0.15));
        const shares = rand(0, Math.floor(impressions * 0.03));
        const clicks = rand(0, Math.floor(impressions * 0.1));
        const saves = rand(0, Math.floor(impressions * 0.05));
        const comments = rand(0, Math.floor(impressions * 0.02));
        const totalEng = likes + shares + clicks + saves + comments;

        const hourly = new Array(24).fill(0).map(() => rand(0, Math.floor(impressions / 8)));

        dailyDocs.push({
          postId: post._id,
          ownerId: post.user || post.author,
          date: ds,
          impressions,
          uniqueViews,
          likes,
          shares,
          clicks,
          saves,
          comments,
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
          engagementRate: impressions > 0 ? (totalEng / impressions) * 100 : 0,
          avgWatchDuration: rand(5, 90),
          avgCompletionRate: Math.random() * 0.8 + 0.1,
          deviceBreakdown: {
            desktop: rand(20, 200),
            mobile: rand(30, 300),
            tablet: rand(5, 50),
          },
          trafficSources: {
            home_feed: rand(10, 200),
            search: rand(5, 100),
            profile: rand(2, 50),
            external: rand(1, 30),
            direct: rand(0, 20),
          },
          topCountries: COUNTRIES.slice(0, 5).map((c) => ({ country: c, count: rand(5, 100) })),
          hourlyDistribution: hourly,
        });
      }
    }

    for (let i = 0; i < dailyDocs.length; i += CHUNK) {
      await PostAnalyticsDaily.insertMany(dailyDocs.slice(i, i + CHUNK), { ordered: false }).catch(() => {});
      process.stdout.write(`\r  PostAnalyticsDaily: ${Math.min(i + CHUNK, dailyDocs.length)}/${dailyDocs.length}`);
    }
    console.log(`\n✅  Inserted ~${dailyDocs.length} PostAnalyticsDaily records`);

    // ── 4. Generate CreatorAnalyticsSnapshots ──────────────────────────
    console.log('Generating CreatorAnalyticsSnapshots...');
    const snapshots = [];
    for (const user of users) {
      let followerCount = rand(50, 5000);
      for (let d = DAYS_BACK; d >= 0; d--) {
        if (chance(15)) continue;
        const date = new Date();
        date.setDate(date.getDate() - d);
        const ds = dateStr(date);

        const gained = rand(0, 30);
        const lost = rand(0, 10);
        followerCount = Math.max(0, followerCount + gained - lost);

        const totalImpressions = rand(200, 8000);
        const totalLikes = rand(10, Math.floor(totalImpressions * 0.12));
        const totalShares = rand(0, Math.floor(totalImpressions * 0.03));
        const totalClicks = rand(5, Math.floor(totalImpressions * 0.08));
        const totalSaves = rand(0, Math.floor(totalImpressions * 0.04));
        const totalComments = rand(0, Math.floor(totalImpressions * 0.02));

        snapshots.push({
          userId: user._id,
          date: ds,
          totalImpressions,
          totalUniqueViews: Math.floor(totalImpressions * 0.7),
          totalLikes,
          totalShares,
          totalClicks,
          totalSaves,
          totalComments,
          followerCount,
          followersGained: gained,
          followersLost: lost,
          followersNet: gained - lost,
          performanceScore: rand(20, 95),
          viralProbabilityScore: Math.random() * 0.6,
          estimatedRevenue: rand(0, 50),
          deviceBreakdown: {
            desktop: rand(50, 400),
            mobile: rand(100, 600),
            tablet: rand(10, 80),
          },
          audienceActiveHours: new Array(24).fill(0).map(() => rand(0, 100)),
        });
      }
    }

    for (let i = 0; i < snapshots.length; i += CHUNK) {
      await CreatorAnalyticsSnapshot.insertMany(snapshots.slice(i, i + CHUNK), { ordered: false }).catch(() => {});
      process.stdout.write(`\r  CreatorAnalyticsSnapshots: ${Math.min(i + CHUNK, snapshots.length)}/${snapshots.length}`);
    }
    console.log(`\n✅  Inserted ~${snapshots.length} CreatorAnalyticsSnapshots`);

    console.log('\n🎉 Analytics seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seedAnalytics();

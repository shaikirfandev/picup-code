/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  E.D.I.T.H — Unified Seed Script v3 (All 29 Collections)              ║
 * ║                                                                          ║
 * ║  Seeds every collection for a fully-working demo environment:            ║
 * ║    Core      →  Users · Categories · Posts · Comments · Boards           ║
 * ║    Social    →  Likes · Saves · Follows · Notifications                  ║
 * ║    Analytics →  PostEvents · PostAnalyticsDaily · CreatorSnapshots        ║
 * ║    Creator   →  CreatorProfiles · ContentMetrics · AudienceDemographics  ║
 * ║                 ActivityEvents · CreatorRevenue · ScheduledPosts          ║
 * ║    Finance   →  Payments · Wallets · Advertisements · AdClickEvents      ║
 * ║                 WithdrawRequests · PaymentMethods · AffiliateClicks       ║
 * ║    Content   →  BlogPosts · Reports · LoginLogs · DailyStats             ║
 * ║    AI        →  AIGenerations · AuditLogs                                ║
 * ║                                                                          ║
 * ║  Run:  node src/seeds/seed-all.js                                        ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');

// ─── Models (29) ───────────────────────────────────────────────────────────────
const User = require('../models/User');
const Category = require('../models/Category');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Board = require('../models/Board');
const Notification = require('../models/Notification');
const { Like, Save, Follow } = require('../models/Interaction');
const PostEvent = require('../models/PostEvent');
const PostAnalyticsDaily = require('../models/PostAnalyticsDaily');
const CreatorAnalyticsSnapshot = require('../models/CreatorAnalyticsSnapshot');
const ContentMetrics = require('../models/ContentMetrics');
const CreatorRevenue = require('../models/CreatorRevenue');
const CreatorProfile = require('../models/CreatorProfile');
const AudienceDemographic = require('../models/AudienceDemographic');
const ActivityEvent = require('../models/ActivityEvent');
const ScheduledPost = require('../models/ScheduledPost');
const Payment = require('../models/Payment');
const Wallet = require('../models/Wallet');
const Advertisement = require('../models/Advertisement');
const AdClickEvent = require('../models/AdClickEvent');
const AffiliateClick = require('../models/AffiliateClick');
const WithdrawRequest = require('../models/WithdrawRequest');
const PaymentMethod = require('../models/PaymentMethod');
const BlogPost = require('../models/BlogPost');
const Report = require('../models/Report');
const LoginLog = require('../models/LoginLog');
const DailyStats = require('../models/DailyStats');
const AIGeneration = require('../models/AIGeneration');
const AuditLog = require('../models/AuditLog');

// ─── Helpers ───────────────────────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, decimals = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const daysAgo = (n) => new Date(Date.now() - n * 86400000);
const dateStr = (d) => d.toISOString().split('T')[0]; // YYYY-MM-DD
const uuid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ─── Data pools ────────────────────────────────────────────────────────────────
const categories = [
  { name: 'Technology', slug: 'technology', icon: '💻', color: '#3b82f6', description: 'Gadgets, AI, and software', order: 1 },
  { name: 'Design', slug: 'design', icon: '🎨', color: '#8b5cf6', description: 'UI/UX, graphic design, and typography', order: 2 },
  { name: 'Photography', slug: 'photography', icon: '📸', color: '#ec4899', description: 'Camera gear and photo inspiration', order: 3 },
  { name: 'Fashion', slug: 'fashion', icon: '👗', color: '#f43f5e', description: 'Style, outfits, and trends', order: 4 },
  { name: 'Home & Decor', slug: 'home-decor', icon: '🏠', color: '#f59e0b', description: 'Interior design and DIY', order: 5 },
  { name: 'Food & Drink', slug: 'food-drink', icon: '🍕', color: '#ef4444', description: 'Recipes and restaurant reviews', order: 6 },
  { name: 'Travel', slug: 'travel', icon: '✈️', color: '#06b6d4', description: 'Destinations and travel tips', order: 7 },
  { name: 'Art', slug: 'art', icon: '🖼️', color: '#a855f7', description: 'Digital art, illustrations, and NFTs', order: 8 },
  { name: 'Fitness', slug: 'fitness', icon: '💪', color: '#22c55e', description: 'Workout gear and health tips', order: 9 },
  { name: 'Gaming', slug: 'gaming', icon: '🎮', color: '#6366f1', description: 'Game setups and reviews', order: 10 },
  { name: 'Beauty', slug: 'beauty', icon: '💄', color: '#f472b6', description: 'Skincare and beauty products', order: 11 },
  { name: 'Automotive', slug: 'automotive', icon: '🚗', color: '#64748b', description: 'Cars and accessories', order: 12 },
];

const firstNames = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Elijah', 'Sophia', 'James',
  'Isabella', 'Oliver', 'Mia', 'Benjamin', 'Charlotte', 'Lucas', 'Amelia',
  'Mason', 'Harper', 'Ethan', 'Evelyn', 'Alexander', 'Luna', 'Daniel',
  'Ella', 'Matthew', 'Scarlett', 'Aiden', 'Grace', 'Henry', 'Chloe', 'Sebastian',
  'Aria', 'Jack', 'Riley', 'Owen', 'Zoey', 'Samuel', 'Nora', 'Ryan',
  'Lily', 'Nathan', 'Eleanor', 'Caleb', 'Hannah', 'Leo', 'Layla', 'Isaac',
  'Penelope', 'Dylan', 'Violet', 'Adrian',
];
const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen',
  'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera',
  'Campbell', 'Mitchell', 'Carter', 'Roberts',
];
const bios = [
  'UI/UX Designer • Loves minimal aesthetics',
  'Full-stack developer & open-source enthusiast 🚀',
  'Photographer • Digital nomad 🌍',
  'Content creator & visual storyteller 📱',
  'Foodie • Always exploring new cuisines 🍜',
  'Minimalist designer • Less is more',
  'Tech reviewer & gadget enthusiast',
  'Travel blogger • 50+ countries visited',
  'AI enthusiast & creative coder',
  'Fashion stylist • Vintage lover 🖤',
];
const locations = [
  'San Francisco, CA', 'New York, NY', 'London, UK', 'Tokyo, Japan',
  'Berlin, Germany', 'Paris, France', 'Sydney, Australia', 'Toronto, Canada',
  'Seoul, South Korea', 'Austin, TX', 'Portland, OR', 'Amsterdam, NL',
  'Barcelona, Spain', 'Singapore', 'Dubai, UAE', 'Mumbai, India',
];
const postTitles = [
  'Minimal Desk Setup for Productivity', 'Sunset Photography Tips', 'Modern Kitchen Design Ideas',
  'Cozy Reading Nook Inspiration', 'Street Style Summer 2025', 'AI-Generated Abstract Art',
  'Healthy Meal Prep Guide', 'Tokyo Night Photography', 'Scandinavian Living Room',
  'Vintage Camera Collection', 'Mountain Hiking Essentials', 'Workspace Lighting Guide',
  'Plant-Based Recipe Ideas', 'Urban Architecture Photography', 'Smart Home Automation Setup',
  'Coffee Shop Interior Design', 'Handmade Jewelry Collection', 'Digital Art Process Breakdown',
  'Beach Vacation Packing List', 'Mechanical Keyboard Build',
  'Studio Apartment Makeover', 'Content Creator Starter Kit', 'Digital Art Tablet Setup',
  'Retro Gaming Corner', 'Sustainable Fashion Haul', 'Drone Photography Tutorial',
  'Pottery Workshop Results', 'Electric Vehicle Road Trip', 'Rooftop Garden Design',
  'Bullet Journal Spread Ideas', 'DIY Floating Shelf Install', 'Vegan Baking Masterclass',
  'Astrophotography First Attempt', 'Capsule Wardrobe Essentials', 'AR Filter Design Process',
  'Vinyl Record Wall Display', 'Zero Waste Bathroom Tour', 'Underwater Photography Gear',
  'Neon Sign Custom Build', 'Tiny House Tour',
];
const tags = [
  'minimal', 'design', 'photography', 'tech', 'food', 'travel', 'art', 'fitness',
  'fashion', 'diy', 'coding', 'nature', 'music', 'gaming', 'beauty', 'home',
  'workspace', 'vintage', 'modern', 'creative', 'handmade', 'sustainable',
  'architecture', 'coffee', 'plants', 'hiking', 'yoga', 'productivity',
  'ai', 'gadgets', 'recipe', 'startup', 'wellness', 'street-style',
];
const productUrls = [
  'https://amazon.com/dp/B09example1', 'https://etsy.com/listing/12345',
  'https://shop.example.com/desk-lamp', 'https://amazon.com/dp/B09example2',
  'https://store.example.com/camera-kit', '',
];
const countries = ['US', 'UK', 'DE', 'JP', 'IN', 'CA', 'AU', 'FR', 'BR', 'KR', 'SG', 'AE'];
const cities = ['New York', 'London', 'Berlin', 'Tokyo', 'Mumbai', 'Toronto', 'Sydney', 'Paris', 'São Paulo', 'Seoul'];
const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
const oses = ['Windows 11', 'macOS 14', 'Linux', 'iOS 17', 'Android 14'];
const devices = ['desktop', 'mobile', 'tablet'];
const referrers = ['home_feed', 'search', 'profile', 'external', 'direct', 'notification', 'board'];
const adTitles = [
  'Premium Design Tools — 50% Off', 'AI Photo Editor Pro', 'Cloud Hosting Flash Sale',
  'Pro Camera Bundle Deal', 'Creative Suite Subscription', 'Learn UI/UX Design',
  'Smart Home Starter Kit', 'Travel Insurance — 30% Off', 'Fitness Tracker Sale',
  'Premium Templates Pack', 'SEO Toolkit Launch', 'Stock Photo Premium',
  'WordPress Theme Bundle', 'Photography Masterclass', 'Coding Bootcamp Discount',
  'VPN Premium Annual Deal', 'Social Media Scheduler', 'Email Marketing Platform',
  'Logo Design Service', 'Web Analytics Dashboard', 'Mobile App Dev Course',
  'Graphic Design Bundle', 'Video Editing Software', 'Podcast Hosting Plan',
  'E-Commerce Platform Trial', 'Digital Marketing Course', 'Resume Builder Pro',
  'Project Management Tool', 'CRM Software Discount', 'Illustration Workshop',
  'Music Production Suite', '3D Rendering Software', 'Data Science Bootcamp',
  'Language Learning App', 'Note-Taking App Premium', 'Password Manager Deal',
  'Streaming Service Bundle', 'Cloud Storage Upgrade', 'Backup Solution Sale',
  'Domain & Hosting Combo',
];
const blogCategories = ['technology', 'ai', 'web-development', 'mobile', 'cloud', 'cybersecurity', 'gadgets', 'software', 'tutorials', 'news'];
const blogTitles = [
  'The Future of AI in Visual Discovery', 'Building Scalable APIs with Node.js',
  'React Server Components Explained', 'MongoDB Aggregation Pipeline Deep Dive',
  'WebSocket Real-Time Architecture', 'Cloudinary Image Optimization Strategies',
  'JWT Authentication Best Practices', 'Redis Caching Patterns for E-Commerce',
  'Next.js 14 App Router Migration Guide', 'Docker Compose for Full-Stack Dev',
  'Building a Creator Economy Platform', 'GraphQL vs REST in 2025',
  'Edge Computing for Media Delivery', 'CI/CD Pipelines with GitHub Actions',
  'TypeScript 5 New Features Deep Dive', 'Tailwind CSS 4 Utility Patterns',
  'Kubernetes Pod Autoscaling Strategies', 'Microservices vs Monolith Trade-offs',
  'Web Vitals Performance Optimization', 'Stripe Payment Integration Guide',
];
const aiPrompts = [
  'A futuristic cityscape at sunset with neon lights reflecting on rain-soaked streets',
  'A serene Japanese garden with cherry blossoms and a wooden bridge',
  'Abstract geometric patterns in vibrant purple and teal gradients',
  'A cozy cabin in snowy mountains with warm light from windows',
  'Underwater coral reef with tropical fish and sunlight rays',
  'A steampunk library with mechanical bookshelves and copper pipes',
  'Minimalist product photography of a ceramic vase on marble',
  'Cyberpunk street market with holographic signs and neon food stalls',
  'Aerial view of lavender fields in Provence at golden hour',
  'A surreal floating island with waterfalls and ancient ruins',
  'A retro 80s arcade with glowing game machines and pixel art',
  'An enchanted forest with bioluminescent mushrooms and fireflies',
  'A modern minimalist workspace with natural light and plants',
  'A space station observation deck overlooking Earth at night',
  'A vintage bookshop in Paris with stacked books and warm lamps',
];
const aiStyles = ['photographic', 'digital-art', 'anime', 'cinematic', 'fantasy-art', 'neon-punk', '3d-model', 'pixel-art'];
const aiModels = ['stable-diffusion-xl-1024-v1-0', 'dall-e-3', 'midjourney-v6'];

// ─── Main seed function ────────────────────────────────────────────────────────
async function seed() {
  const startTime = Date.now();

  // Connect
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('📦 Connected to MongoDB\n');

  // ═══════════════════════════════════════════════════════════════════════════
  //  PHASE 0 — CLEAR ALL COLLECTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🗑️  Clearing all collections...');
  await Promise.all([
    User.deleteMany({}), Category.deleteMany({}), Post.deleteMany({}),
    Comment.deleteMany({}), Board.deleteMany({}), Notification.deleteMany({}),
    Like.deleteMany({}), Save.deleteMany({}), Follow.deleteMany({}),
    PostEvent.deleteMany({}), PostAnalyticsDaily.deleteMany({}),
    CreatorAnalyticsSnapshot.deleteMany({}), ContentMetrics.deleteMany({}),
    CreatorRevenue.deleteMany({}), CreatorProfile.deleteMany({}),
    AudienceDemographic.deleteMany({}), ActivityEvent.deleteMany({}),
    ScheduledPost.deleteMany({}), Payment.deleteMany({}), Wallet.deleteMany({}),
    Advertisement.deleteMany({}), AdClickEvent.deleteMany({}),
    AffiliateClick.deleteMany({}), WithdrawRequest.deleteMany({}),
    PaymentMethod.deleteMany({}), BlogPost.deleteMany({}),
    Report.deleteMany({}), LoginLog.deleteMany({}), DailyStats.deleteMany({}),
    AIGeneration.deleteMany({}), AuditLog.deleteMany({}),
  ]);
  console.log('   ✅ All 29 collections cleared\n');

  // ═══════════════════════════════════════════════════════════════════════════
  //  PHASE 1 — CORE DATA
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📌 PHASE 1 — Core Data');

  // ── 1. CATEGORIES ────────────────────────────────────────────────────────
  const createdCategories = await Category.insertMany(categories);
  const catMap = {};
  createdCategories.forEach((c) => (catMap[c.slug] = c._id));
  console.log(`   ✅ ${createdCategories.length} categories`);

  // ── 2. USERS (50: 1 admin + 2 mods + 10 paid creators + 37 regular) ────
  const adminPw = await bcrypt.hash('admin123', 10);
  const hashedPw = await bcrypt.hash('demo123', 10);

  const usersData = [];
  // Admin
  usersData.push({
    username: 'admin', email: 'admin@picup.app', password: adminPw,
    displayName: 'E.D.I.T.H Admin', role: 'admin', isVerified: true,
    bio: 'Platform administrator', status: 'active',
    avatar: 'https://i.pravatar.cc/300?u=admin',
    accountType: 'paid', createdAt: daysAgo(365),
    followersCount: 500, followingCount: 25, postsCount: 20,
    loginCount: 300, lastLogin: daysAgo(0),
    subscription: { plan: 'enterprise', startDate: daysAgo(365), endDate: daysAgo(-365), isActive: true },
  });
  // Moderators (2)
  for (let i = 0; i < 2; i++) {
    usersData.push({
      username: `mod${i + 1}`, displayName: `Moderator ${i + 1}`,
      email: `mod${i + 1}@picup.app`, password: hashedPw,
      role: 'moderator', isVerified: true, bio: 'Content moderator',
      avatar: `https://i.pravatar.cc/300?u=mod${i + 1}`,
      status: 'active', location: pick(locations),
      accountType: 'paid', createdAt: daysAgo(300),
      followersCount: randInt(50, 200), followingCount: randInt(10, 50), postsCount: randInt(5, 15),
      loginCount: randInt(50, 150), lastLogin: daysAgo(randInt(0, 3)),
      subscription: { plan: 'pro', startDate: daysAgo(300), endDate: daysAgo(-65), isActive: true },
    });
  }
  // Paid creators (10)
  for (let i = 0; i < 10; i++) {
    const fn = firstNames[i + 3];
    const ln = lastNames[i + 3];
    const plans = ['basic', 'pro', 'enterprise'];
    usersData.push({
      username: `${fn.toLowerCase()}_${ln.toLowerCase()}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@demo.com`,
      password: hashedPw,
      displayName: `${fn} ${ln}`,
      role: 'user', isVerified: true,
      bio: bios[i % bios.length],
      status: 'active', location: pick(locations),
      avatar: `https://i.pravatar.cc/300?u=${fn}${ln}`,
      accountType: 'paid',
      website: `https://${fn.toLowerCase()}.design`,
      followersCount: randInt(200, 8000),
      followingCount: randInt(30, 300),
      postsCount: randInt(15, 60),
      loginCount: randInt(30, 200),
      lastLogin: daysAgo(randInt(0, 5)),
      aiGenerationsTotal: randInt(5, 50),
      createdAt: daysAgo(randInt(60, 180)),
      subscription: {
        plan: pick(plans),
        startDate: daysAgo(randInt(60, 180)),
        endDate: daysAgo(-randInt(30, 365)),
        isActive: true,
      },
    });
  }
  // Regular users (37)
  for (let i = 0; i < 37; i++) {
    const fn = firstNames[(i + 13) % firstNames.length];
    const ln = lastNames[(i + 13) % lastNames.length];
    usersData.push({
      username: `user${i + 1}`,
      email: `user${i + 1}@demo.com`,
      password: hashedPw,
      displayName: `${fn} ${ln}`,
      role: 'user', isVerified: i < 25,
      bio: bios[i % bios.length],
      status: i < 35 ? 'active' : (i < 36 ? 'suspended' : 'banned'),
      location: pick(locations),
      avatar: `https://i.pravatar.cc/300?u=user${i + 1}`,
      accountType: 'free',
      followersCount: randInt(5, 500),
      followingCount: randInt(10, 100),
      postsCount: randInt(0, 20),
      loginCount: randInt(1, 60),
      lastLogin: daysAgo(randInt(0, 30)),
      createdAt: daysAgo(randInt(10, 160)),
    });
  }
  const createdUsers = await User.insertMany(usersData);
  const admin = createdUsers[0];
  const mods = createdUsers.slice(1, 3);
  const paidCreators = createdUsers.slice(3, 13);
  const regularUsers = createdUsers.slice(13);
  const allUsers = createdUsers;
  console.log(`   ✅ ${createdUsers.length} users (1 admin, 2 mods, 10 paid creators, 37 regular)`);

  // ── 3. POSTS (450: mix of images, videos, AI-generated) ─────────────────
  const postsData = [];
  for (let i = 0; i < 450; i++) {
    const author = Math.random() < 0.4
      ? pick(paidCreators)
      : Math.random() < 0.5 ? pick(regularUsers) : pick([admin, ...mods]);
    const cat = pick(createdCategories);
    const isVideo = Math.random() < 0.15;
    const isAi = Math.random() < 0.12;
    const title = postTitles[i % postTitles.length] + (i >= postTitles.length ? ` #${Math.ceil(i / postTitles.length)}` : '');

    const post = {
      title,
      slug: slugify(title, { lower: true, strict: true }) + '-' + uuid(),
      description: `Explore this curated ${cat.name.toLowerCase()} content — ${title}. Tips, inspiration, and product recommendations.`,
      mediaType: isVideo ? 'video' : 'image',
      tags: Array.from({ length: randInt(2, 6) }, () => pick(tags)),
      category: cat._id,
      author: author._id,
      status: i < 430 ? 'published' : pick(['draft', 'pending', 'archived']),
      isAiGenerated: isAi,
      productUrl: Math.random() < 0.3 ? pick(productUrls.filter(Boolean)) : '',
      likesCount: randInt(0, 500),
      savesCount: randInt(0, 200),
      commentsCount: randInt(0, 80),
      viewsCount: randInt(50, 15000),
      clicksCount: randInt(0, 300),
      sharesCount: randInt(0, 100),
      isFeatured: Math.random() < 0.08,
      createdAt: daysAgo(randInt(0, 120)),
    };

    if (isVideo) {
      post.video = {
        url: `https://res.cloudinary.com/demo/video/upload/sample_${i}.mp4`,
        publicId: `videos/sample_${i}`,
        thumbnailUrl: `https://picsum.photos/seed/vid${i}/800/600`,
        duration: randInt(15, 300),
        width: 1920, height: 1080, format: 'mp4', bytes: randInt(5000000, 50000000),
      };
    } else {
      post.image = {
        url: `https://picsum.photos/seed/${i}/800/600`,
        publicId: `posts/img_${i}`,
        thumbnailUrl: `https://picsum.photos/seed/${i}/400/300`,
        width: 800, height: 600,
        dominantColor: pick(['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899']),
      };
      post.thumbnails = {
        small: `https://picsum.photos/seed/${i}/200/150`,
        medium: `https://picsum.photos/seed/${i}/400/300`,
        large: `https://picsum.photos/seed/${i}/800/600`,
      };
    }

    if (isAi) {
      post.aiMetadata = {
        prompt: pick(aiPrompts),
        model: pick(aiModels),
        seed: randInt(100000, 999999),
        style: pick(aiStyles),
      };
    }

    if (post.productUrl) {
      post.price = {
        amount: randFloat(9.99, 299.99),
        currency: 'USD',
        display: `$${randFloat(9.99, 299.99)}`,
      };
    }

    postsData.push(post);
  }
  const createdPosts = await Post.insertMany(postsData);
  console.log(`   ✅ ${createdPosts.length} posts (images, videos, AI-generated)`);

  // ── 4. COMMENTS (800) ───────────────────────────────────────────────────
  const commentTexts = [
    'Love this! 🔥', 'Amazing work!', 'Where can I get this?', 'So inspiring!',
    'Great composition 📸', 'This is incredible', 'Saved for later!', 'Need this in my life',
    'Tutorial please! 🙏', 'The colors are perfect', 'Beautiful shot!', 'Clean design 👌',
    'How did you make this?', 'Absolutely stunning', 'Take my money! 💰',
    'This is next level', 'Can you share the settings?', 'Wow, just wow! 😍',
    'Added to my board', 'Following for more content like this',
  ];
  const commentsData = [];
  for (let i = 0; i < 800; i++) {
    const post = pick(createdPosts.filter((p) => p.status === 'published'));
    commentsData.push({
      text: pick(commentTexts),
      post: post._id,
      user: pick(allUsers)._id,
      parentComment: i > 600 && commentsData.length > 0 ? pick(commentsData.filter((c) => !c.parentComment))._id || null : null,
      likesCount: randInt(0, 30),
      createdAt: daysAgo(randInt(0, 90)),
    });
  }
  const createdComments = await Comment.insertMany(commentsData);
  console.log(`   ✅ ${createdComments.length} comments`);

  // ── 5. BOARDS (60) ──────────────────────────────────────────────────────
  const boardNames = [
    'Design Inspo', 'Tech Wishlist', 'Travel Bucket List', 'Recipe Ideas',
    'Home Office Goals', 'Fashion Picks', 'Art Collection', 'Fitness Motivation',
    'Gift Ideas', 'Photography Tips', 'Reading List', 'Weekend Projects',
  ];
  const boardsData = [];
  for (let i = 0; i < 60; i++) {
    const user = pick(allUsers);
    const boardPosts = Array.from({ length: randInt(3, 12) }, () => pick(createdPosts)._id);
    boardsData.push({
      name: boardNames[i % boardNames.length] + (i >= boardNames.length ? ` ${Math.ceil(i / boardNames.length)}` : ''),
      description: `Curated collection of ${boardNames[i % boardNames.length].toLowerCase()}`,
      user: user._id,
      posts: [...new Set(boardPosts)],
      isPrivate: Math.random() < 0.2,
      createdAt: daysAgo(randInt(5, 120)),
    });
  }
  const createdBoards = await Board.insertMany(boardsData);
  console.log(`   ✅ ${createdBoards.length} boards`);

  // ═══════════════════════════════════════════════════════════════════════════
  //  PHASE 2 — SOCIAL INTERACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n🤝 PHASE 2 — Social Interactions');

  // ── 6. LIKES (2000) ─────────────────────────────────────────────────────
  const likeSet = new Set();
  const likesData = [];
  while (likesData.length < 2000) {
    const user = pick(allUsers);
    const post = pick(createdPosts.filter((p) => p.status === 'published'));
    const key = `${user._id}-${post._id}`;
    if (!likeSet.has(key)) {
      likeSet.add(key);
      likesData.push({ user: user._id, post: post._id, createdAt: daysAgo(randInt(0, 90)) });
    }
  }
  await Like.insertMany(likesData);
  console.log(`   ✅ ${likesData.length} likes`);

  // ── 7. SAVES (800) ──────────────────────────────────────────────────────
  const saveSet = new Set();
  const savesData = [];
  while (savesData.length < 800) {
    const user = pick(allUsers);
    const post = pick(createdPosts.filter((p) => p.status === 'published'));
    const key = `${user._id}-${post._id}`;
    if (!saveSet.has(key)) {
      saveSet.add(key);
      savesData.push({
        user: user._id,
        post: post._id,
        board: Math.random() < 0.5 ? pick(createdBoards.filter((b) => b.user.equals(user._id)))?._id || null : null,
        createdAt: daysAgo(randInt(0, 90)),
      });
    }
  }
  await Save.insertMany(savesData);
  console.log(`   ✅ ${savesData.length} saves`);

  // ── 8. FOLLOWS (600) ────────────────────────────────────────────────────
  const followSet = new Set();
  const followsData = [];
  while (followsData.length < 600) {
    const follower = pick(allUsers);
    const following = pick(allUsers);
    if (follower._id.equals(following._id)) continue;
    const key = `${follower._id}-${following._id}`;
    if (!followSet.has(key)) {
      followSet.add(key);
      followsData.push({ follower: follower._id, following: following._id, createdAt: daysAgo(randInt(0, 120)) });
    }
  }
  await Follow.insertMany(followsData);
  console.log(`   ✅ ${followsData.length} follows`);

  // ── 9. NOTIFICATIONS (400) ──────────────────────────────────────────────
  const notifTypes = ['like', 'comment', 'reply', 'follow', 'save', 'mention', 'system'];
  const notifMessages = {
    like: 'liked your post', comment: 'commented on your post', reply: 'replied to your comment',
    follow: 'started following you', save: 'saved your post', mention: 'mentioned you',
    system: 'Welcome to E.D.I.T.H! Start exploring visual content.',
  };
  const notifsData = [];
  for (let i = 0; i < 400; i++) {
    const type = pick(notifTypes);
    const recipient = pick(allUsers);
    const sender = type === 'system' ? null : pick(allUsers.filter((u) => !u._id.equals(recipient._id)));
    notifsData.push({
      recipient: recipient._id,
      sender: sender ? sender._id : undefined,
      type,
      post: ['like', 'comment', 'save', 'mention'].includes(type) ? pick(createdPosts)._id : undefined,
      comment: type === 'reply' ? pick(createdComments)._id : undefined,
      message: notifMessages[type],
      isRead: Math.random() < 0.6,
      createdAt: daysAgo(randInt(0, 60)),
    });
  }
  await Notification.insertMany(notifsData);
  console.log(`   ✅ ${notifsData.length} notifications`);

  // ═══════════════════════════════════════════════════════════════════════════
  //  PHASE 3 — ANALYTICS & EVENTS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n📊 PHASE 3 — Analytics & Events');

  // ── 10. POST EVENTS (8000) ──────────────────────────────────────────────
  const eventTypes = ['view', 'like', 'share', 'click', 'save', 'comment'];
  const postEventsData = [];
  for (let i = 0; i < 8000; i++) {
    const post = pick(createdPosts.filter((p) => p.status === 'published'));
    postEventsData.push({
      postId: post._id,
      ownerId: post.author,
      viewerId: Math.random() < 0.7 ? pick(allUsers)._id : null,
      eventType: pick(eventTypes),
      sessionId: uuid(),
      ipAddress: `${randInt(1, 255)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`,
      deviceType: pick(devices),
      browser: pick(browsers),
      os: pick(oses),
      country: pick(countries),
      city: pick(cities),
      referrer: pick(referrers),
      createdAt: daysAgo(randInt(0, 60)),
    });
  }
  await PostEvent.insertMany(postEventsData);
  console.log(`   ✅ ${postEventsData.length} post events`);

  // ── 11. POST ANALYTICS DAILY (last 30 days for top 100 posts) ──────────
  const topPosts = createdPosts.filter((p) => p.status === 'published').slice(0, 100);
  const padData = [];
  for (const post of topPosts) {
    for (let d = 0; d < 30; d++) {
      const impressions = randInt(10, 500);
      const clicks = randInt(0, Math.floor(impressions * 0.15));
      const likes = randInt(0, Math.floor(impressions * 0.1));
      padData.push({
        postId: post._id,
        ownerId: post.author,
        date: dateStr(daysAgo(d)),
        impressions,
        uniqueViews: Math.floor(impressions * randFloat(0.6, 0.9)),
        likes,
        shares: randInt(0, 20),
        clicks,
        saves: randInt(0, 15),
        comments: randInt(0, 10),
        ctr: impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0,
        engagementRate: impressions > 0 ? parseFloat((((likes + randInt(0, 5)) / impressions) * 100).toFixed(2)) : 0,
        deviceBreakdown: { desktop: randInt(20, 60), mobile: randInt(30, 60), tablet: randInt(5, 15), unknown: randInt(0, 5) },
        trafficSources: { home_feed: randInt(20, 60), search: randInt(5, 25), profile: randInt(5, 15), external: randInt(0, 10), direct: randInt(2, 10), notification: randInt(0, 5), board: randInt(0, 5), unknown: randInt(0, 3) },
        topCountries: countries.slice(0, 5).map((c) => ({ country: c, count: randInt(5, 50) })),
        hourlyDistribution: Array.from({ length: 24 }, () => randInt(0, 20)),
      });
    }
  }
  await PostAnalyticsDaily.insertMany(padData);
  console.log(`   ✅ ${padData.length} post analytics daily records (${topPosts.length} posts × 30 days)`);

  // ── 12. CREATOR ANALYTICS SNAPSHOTS (10 creators × 30 days) ────────────
  const snapshotsData = [];
  for (const creator of paidCreators) {
    for (let d = 0; d < 30; d++) {
      const imps = randInt(500, 5000);
      snapshotsData.push({
        userId: creator._id,
        date: dateStr(daysAgo(d)),
        totalPosts: randInt(10, 60),
        totalImpressions: imps,
        totalUniqueViews: Math.floor(imps * randFloat(0.5, 0.85)),
        totalLikes: randInt(50, 800),
        totalShares: randInt(10, 100),
        totalSaves: randInt(20, 200),
        totalComments: randInt(10, 150),
        totalClicks: randInt(30, 400),
        totalAffiliateClicks: randInt(0, 50),
        ctr: randFloat(1, 8),
        engagementRate: randFloat(2, 15),
        estimatedRevenue: randFloat(1, 50),
        followersCount: creator.followersCount + randInt(-5, 20),
        followersGained: randInt(0, 25),
        followersLost: randInt(0, 5),
        netFollowerGrowth: randInt(-3, 20),
        performanceScore: randFloat(30, 95),
        viralProbabilityScore: randFloat(5, 60),
        topPost: { postId: pick(createdPosts)._id, title: pick(postTitles), impressions: randInt(100, 2000), engagementRate: randFloat(2, 20) },
        deviceBreakdown: { desktop: randInt(30, 50), mobile: randInt(35, 55), tablet: randInt(5, 15), unknown: randInt(0, 5) },
        audienceActiveHours: Array.from({ length: 24 }, () => randInt(0, 100)),
      });
    }
  }
  await CreatorAnalyticsSnapshot.insertMany(snapshotsData);
  console.log(`   ✅ ${snapshotsData.length} creator analytics snapshots`);

  // ── 13. CONTENT METRICS (for top 150 posts) ────────────────────────────
  const metricsData = [];
  const metricsPosts = createdPosts.filter((p) => p.status === 'published').slice(0, 150);
  for (const post of metricsPosts) {
    const views = randInt(100, 10000);
    metricsData.push({
      post: post._id,
      creator: post.author,
      totalViews: views,
      uniqueViews: Math.floor(views * randFloat(0.5, 0.85)),
      totalLikes: randInt(10, 500),
      totalComments: randInt(5, 100),
      totalShares: randInt(2, 80),
      totalSaves: randInt(5, 150),
      totalClicks: randInt(10, 300),
      engagementRate: randFloat(2, 20),
      clickThroughRate: randFloat(0.5, 8),
      performanceScore: randFloat(20, 95),
      performanceTier: pick(['low', 'average', 'good', 'viral']),
      isTopPerforming: Math.random() < 0.15,
      viewsTrend: Array.from({ length: 7 }, (_, j) => ({ date: dateStr(daysAgo(6 - j)), value: randInt(10, 500) })),
      engagementTrend: Array.from({ length: 7 }, (_, j) => ({ date: dateStr(daysAgo(6 - j)), value: randFloat(1, 15) })),
      lastAggregatedAt: daysAgo(0),
    });
  }
  await ContentMetrics.insertMany(metricsData);
  console.log(`   ✅ ${metricsData.length} content metrics`);

  // ═══════════════════════════════════════════════════════════════════════════
  //  PHASE 4 — CREATOR ECONOMY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n💼 PHASE 4 — Creator Economy');

  // ── 14. CREATOR PROFILES ────────────────────────────────────────────────
  const tiers = ['starter', 'partner', 'premium', 'elite'];
  const profilesData = paidCreators.map((creator, i) => ({
    user: creator._id,
    isCreator: true,
    creatorSince: creator.createdAt,
    verificationStatus: i < 6 ? 'verified' : pick(['pending', 'unverified']),
    monetizationEnabled: true,
    monetizationEnabledAt: creator.createdAt,
    monetizationTier: tiers[i % tiers.length],
    adRevenueEnabled: true,
    sponsorshipEnabled: i < 5,
    donationsEnabled: true,
    tipsEnabled: true,
    subscriptionEnabled: i < 4,
    premiumContentEnabled: i < 3,
    affiliateEnabled: true,
    payoutMethod: pick(['bank_transfer', 'paypal', 'stripe']),
    payoutDetails: { paypalEmail: `${creator.username}@paypal.com` },
    minimumPayout: pick([25, 50, 100]),
    payoutSchedule: pick(['weekly', 'biweekly', 'monthly']),
    subscriptionTiers: i < 4 ? [
      { name: 'Basic Fan', price: 4.99, currency: 'USD', benefits: ['Early access', 'Exclusive posts'], isActive: true },
      { name: 'Super Fan', price: 14.99, currency: 'USD', benefits: ['All Basic perks', 'Monthly Q&A', 'Behind-the-scenes'], isActive: true },
    ] : [],
    dashboardLayout: pick(['default', 'compact', 'detailed']),
    emailReports: { enabled: true, frequency: pick(['daily', 'weekly', 'monthly']) },
    goals: {
      followerTarget: randInt(5000, 50000),
      monthlyRevenueTarget: randInt(500, 5000),
      engagementRateTarget: randFloat(5, 20),
      postsPerWeekTarget: randInt(3, 10),
    },
    lifetimeRevenue: randFloat(500, 15000),
    lifetimePayouts: randFloat(200, 10000),
    pendingBalance: randFloat(50, 2000),
    totalSubscribers: randInt(10, 500),
    totalDonationsReceived: randInt(5, 200),
  }));
  await CreatorProfile.insertMany(profilesData);
  console.log(`   ✅ ${profilesData.length} creator profiles`);

  // ── 15. CREATOR REVENUE (200 entries) ───────────────────────────────────
  const revenueTypes = ['ad_revenue', 'sponsorship', 'donation', 'tip', 'subscription', 'affiliate'];
  const revenueData = [];
  for (const creator of paidCreators) {
    for (let j = 0; j < 20; j++) {
      const amount = randFloat(5, 500);
      const feePercent = 15;
      const platformFee = parseFloat((amount * feePercent / 100).toFixed(2));
      revenueData.push({
        creator: creator._id,
        type: pick(revenueTypes),
        amount,
        netAmount: parseFloat((amount - platformFee).toFixed(2)),
        platformFee,
        platformFeePercent: feePercent,
        status: pick(['pending', 'approved', 'paid']),
        description: `Revenue from ${pick(revenueTypes).replace('_', ' ')}`,
        periodStart: daysAgo(randInt(30, 90)),
        periodEnd: daysAgo(randInt(0, 29)),
        createdAt: daysAgo(randInt(0, 90)),
      });
    }
  }
  await CreatorRevenue.insertMany(revenueData);
  console.log(`   ✅ ${revenueData.length} creator revenue entries`);

  // ── 16. AUDIENCE DEMOGRAPHICS (10 creators × 7 days) ───────────────────
  const demoData = [];
  for (const creator of paidCreators) {
    for (let d = 0; d < 7; d++) {
      demoData.push({
        creator: creator._id,
        date: dateStr(daysAgo(d)),
        totalFollowers: creator.followersCount + randInt(-10, 30),
        totalProfileVisits: randInt(50, 500),
        totalContentViewers: randInt(200, 3000),
        ageGroups: { '13-17': randInt(2, 8), '18-24': randInt(25, 40), '25-34': randInt(25, 35), '35-44': randInt(10, 20), '45-54': randInt(3, 10), '55+': randInt(1, 5) },
        genderDistribution: { male: randInt(30, 50), female: randInt(35, 55), other: randInt(2, 8), unknown: randInt(1, 5) },
        countries: countries.slice(0, 6).map((c, idx) => ({ code: c, name: c, count: randInt(10, 200), percentage: randFloat(5, 30) })),
        cities: cities.slice(0, 5).map((c) => ({ name: c, country: pick(countries), count: randInt(5, 80), percentage: randFloat(3, 20) })),
      });
    }
  }
  await AudienceDemographic.insertMany(demoData);
  console.log(`   ✅ ${demoData.length} audience demographics`);

  // ── 17. ACTIVITY EVENTS (500) ──────────────────────────────────────────
  const actEventTypes = ['new_follower', 'post_like', 'post_comment', 'post_share', 'post_save', 'post_view_milestone', 'profile_visit', 'donation_received', 'tip_received', 'content_trending'];
  const actEventsData = [];
  for (let i = 0; i < 500; i++) {
    const creator = pick(paidCreators);
    const type = pick(actEventTypes);
    actEventsData.push({
      creator: creator._id,
      eventType: type,
      actor: pick(allUsers.filter((u) => !u._id.equals(creator._id)))._id,
      actorName: pick(firstNames),
      actorAvatar: `https://i.pravatar.cc/40?u=act${i}`,
      post: ['post_like', 'post_comment', 'post_share', 'post_save', 'content_trending'].includes(type) ? pick(createdPosts)._id : undefined,
      postTitle: pick(postTitles),
      message: `${pick(firstNames)} ${type.replace(/_/g, ' ')} on your content`,
      amount: ['donation_received', 'tip_received'].includes(type) ? randFloat(1, 50) : undefined,
      currency: ['donation_received', 'tip_received'].includes(type) ? 'USD' : undefined,
      milestone: type === 'post_view_milestone' ? pick([100, 500, 1000, 5000, 10000]) : undefined,
      isRead: Math.random() < 0.5,
      createdAt: daysAgo(randInt(0, 25)),
    });
  }
  await ActivityEvent.insertMany(actEventsData);
  console.log(`   ✅ ${actEventsData.length} activity events`);

  // ── 18. SCHEDULED POSTS (30) ───────────────────────────────────────────
  const scheduledData = [];
  for (let i = 0; i < 30; i++) {
    const creator = pick(paidCreators);
    scheduledData.push({
      creator: creator._id,
      post: pick(createdPosts.filter((p) => p.author.equals(creator._id)))?._id || pick(createdPosts)._id,
      scheduledFor: new Date(Date.now() + randInt(1, 30) * 86400000),
      timezone: pick(['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Asia/Kolkata']),
      status: i < 20 ? 'scheduled' : pick(['published', 'cancelled']),
      recurring: Math.random() < 0.2,
      recurrencePattern: Math.random() < 0.2 ? pick(['daily', 'weekly', 'monthly']) : undefined,
      notes: `Auto-scheduled post #${i + 1}`,
      createdAt: daysAgo(randInt(0, 15)),
    });
  }
  await ScheduledPost.insertMany(scheduledData);
  console.log(`   ✅ ${scheduledData.length} scheduled posts`);

  // ═══════════════════════════════════════════════════════════════════════════
  //  PHASE 5 — FINANCE & ADVERTISING
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n💰 PHASE 5 — Finance & Advertising');

  // ── 19. ADVERTISEMENTS (40) ─────────────────────────────────────────────
  const adsData = [];
  for (let i = 0; i < 40; i++) {
    const advertiser = pick(paidCreators);
    const budget = randFloat(50, 2000);
    const spent = randFloat(0, budget * 0.8);
    const imps = randInt(500, 50000);
    const clks = randInt(10, Math.floor(imps * 0.08));
    const startDaysAgo = randInt(5, 60);
    adsData.push({
      title: adTitles[i % adTitles.length],
      description: `Promote your ${pick(['product', 'service', 'brand', 'content'])} to thousands of engaged users.`,
      image: {
        url: `https://picsum.photos/seed/ad${i}/600/400`,
        publicId: `ads/ad_${i}`,
        width: 600, height: 400,
      },
      redirectUrl: `https://example.com/ad/${i}?ref=picup`,
      advertiser: advertiser._id,
      campaign: {
        name: `Campaign ${i + 1}`,
        startDate: daysAgo(startDaysAgo),
        endDate: daysAgo(startDaysAgo - 30),
        budget,
        spent,
        currency: 'USD',
      },
      placement: pick(['feed', 'sidebar', 'banner', 'search']),
      status: i < 8 ? 'active' : pick(['draft', 'pending', 'paused', 'completed', 'rejected']),
      isPaid: true,
      impressions: imps,
      clicks: clks,
      likes: randInt(0, 100),
      shares: randInt(0, 30),
      views: Math.floor(imps * randFloat(0.3, 0.7)),
      ctr: imps > 0 ? parseFloat(((clks / imps) * 100).toFixed(2)) : 0,
      targetCategories: [pick(createdCategories)._id],
      targetTags: Array.from({ length: 3 }, () => pick(tags)),
      targetLocations: [pick(locations), pick(locations)],
      targetAudience: pick(['all', 'followers', 'new_users', 'returning_users']),
      promotionType: pick(['standard', 'featured', 'homepage', 'category_boost']),
      dailyStats: Array.from({ length: Math.min(startDaysAgo, 20) }, (_, d) => ({
        date: daysAgo(d),
        impressions: randInt(50, 2000),
        clicks: randInt(2, 100),
        views: randInt(20, 800),
        spent: randFloat(1, 30),
      })),
      createdAt: daysAgo(startDaysAgo),
    });
  }
  const createdAds = await Advertisement.insertMany(adsData);
  console.log(`   ✅ ${createdAds.length} advertisements`);

  // ── 20. AD CLICK EVENTS (6000) ─────────────────────────────────────────
  const adClickData = [];
  for (let i = 0; i < 6000; i++) {
    const ad = pick(createdAds);
    adClickData.push({
      advertisement: ad._id,
      eventType: pick(['impression', 'impression', 'impression', 'click', 'view', 'conversion']),
      user: Math.random() < 0.6 ? pick(allUsers)._id : null,
      sessionId: uuid(),
      ip: `${randInt(1, 255)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`,
      userAgent: `Mozilla/5.0 (${pick(oses)}) ${pick(browsers)}`,
      country: pick(countries),
      city: pick(cities),
      deviceType: pick(devices),
      browser: pick(browsers),
      os: pick(oses),
      referrer: pick(referrers),
      placement: ad.placement,
      costPerClick: ad.campaign.budget > 0 ? randFloat(0.1, 2.5) : 0,
      costPerImpression: randFloat(0.001, 0.05),
      isSuspicious: Math.random() < 0.02,
      suspiciousReason: Math.random() < 0.02 ? pick(['rapid_clicks', 'bot_pattern', 'vpn_detected']) : '',
      createdAt: daysAgo(randInt(0, 60)),
    });
  }
  await AdClickEvent.insertMany(adClickData);
  console.log(`   ✅ ${adClickData.length} ad click events`);

  // ── 21. AFFILIATE CLICKS (800) ─────────────────────────────────────────
  const affData = [];
  const postsWithProducts = createdPosts.filter((p) => p.productUrl);
  for (let i = 0; i < 800; i++) {
    const post = postsWithProducts.length > 0 ? pick(postsWithProducts) : pick(createdPosts);
    affData.push({
      postId: post._id,
      ownerId: post.author,
      clickerId: Math.random() < 0.6 ? pick(allUsers)._id : null,
      productUrl: post.productUrl || 'https://example.com/product',
      sessionId: uuid(),
      ipAddress: `${randInt(1, 255)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`,
      deviceType: pick(devices),
      browser: pick(browsers),
      os: pick(oses),
      country: pick(countries),
      city: pick(cities),
      referrer: pick(referrers),
      converted: Math.random() < 0.08,
      conversionValue: Math.random() < 0.08 ? randFloat(5, 200) : 0,
      createdAt: daysAgo(randInt(0, 60)),
    });
  }
  await AffiliateClick.insertMany(affData);
  console.log(`   ✅ ${affData.length} affiliate clicks`);

  // ── 22. PAYMENTS (120) ──────────────────────────────────────────────────
  const paymentsData = [];
  for (let i = 0; i < 120; i++) {
    const user = pick([...paidCreators, ...regularUsers.slice(0, 10)]);
    const type = pick(['ad_payment', 'subscription', 'wallet_topup', 'refund']);
    paymentsData.push({
      user: user._id,
      type,
      amount: randFloat(5, 500),
      currency: 'USD',
      gateway: pick(['stripe', 'razorpay', 'manual']),
      gatewayPaymentId: `pay_${uuid()}`,
      status: pick(['completed', 'completed', 'completed', 'pending', 'failed']),
      advertisement: type === 'ad_payment' ? pick(createdAds)._id : undefined,
      description: `${type.replace(/_/g, ' ')} — ${pick(['monthly', 'one-time', 'annual'])}`,
      paidAt: daysAgo(randInt(0, 90)),
      createdAt: daysAgo(randInt(0, 90)),
    });
  }
  const createdPayments = await Payment.insertMany(paymentsData);
  console.log(`   ✅ ${createdPayments.length} payments`);

  // ── 23. WALLETS (for paid creators + some regulars) ────────────────────
  const walletUsers = [...paidCreators, ...regularUsers.slice(0, 8)];
  const walletsData = walletUsers.map((user) => {
    const txns = [];
    let balance = 0;
    const numTxns = randInt(4, 15);
    for (let t = 0; t < numTxns; t++) {
      const txnType = pick(['credit', 'credit', 'credit', 'debit', 'bonus']);
      const amount = randFloat(5, 200);
      if (txnType === 'debit' && balance < amount) {
        balance += amount; // Make it a credit instead
        txns.push({ type: 'credit', amount, description: 'Ad revenue', reference: `rev_${uuid()}`, balanceAfter: balance, createdAt: daysAgo(numTxns - t) });
      } else {
        if (txnType === 'debit') balance -= amount;
        else balance += amount;
        txns.push({
          type: txnType,
          amount,
          description: txnType === 'credit' ? pick(['Ad revenue', 'Sponsorship payout', 'Tip received', 'Wallet top-up'])
            : txnType === 'bonus' ? 'Welcome bonus' : pick(['Ad campaign spend', 'Withdrawal', 'Subscription fee']),
          reference: `${txnType}_${uuid()}`,
          balanceAfter: parseFloat(balance.toFixed(2)),
          createdAt: daysAgo(numTxns - t),
        });
      }
    }
    return {
      user: user._id,
      balance: parseFloat(Math.max(0, balance).toFixed(2)),
      currency: 'USD',
      totalCredits: parseFloat(txns.filter((t) => t.type !== 'debit').reduce((s, t) => s + t.amount, 0).toFixed(2)),
      totalDebits: parseFloat(txns.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0).toFixed(2)),
      transactions: txns,
    };
  });
  await Wallet.insertMany(walletsData);
  console.log(`   ✅ ${walletsData.length} wallets`);

  // ── 24. PAYMENT METHODS (for paid creators) ────────────────────────────
  const pmTypes = ['credit_card', 'debit_card', 'upi', 'paypal', 'bank_account'];
  const pmBrands = ['visa', 'mastercard', 'amex', 'discover'];
  const pmData = [];
  for (const creator of paidCreators) {
    const numMethods = randInt(1, 3);
    for (let m = 0; m < numMethods; m++) {
      const type = pick(pmTypes);
      pmData.push({
        user: creator._id,
        type,
        label: type === 'credit_card' ? `${pick(pmBrands).toUpperCase()} •••• ${randInt(1000, 9999)}`
          : type === 'paypal' ? `PayPal (${creator.username}@paypal.com)`
          : type === 'upi' ? `UPI (${creator.username}@upi)`
          : type === 'bank_account' ? 'Bank Account •••• ' + randInt(1000, 9999)
          : `Debit •••• ${randInt(1000, 9999)}`,
        details: {
          last4: `${randInt(1000, 9999)}`,
          brand: type.includes('card') ? pick(pmBrands) : '',
          expiryMonth: randInt(1, 12),
          expiryYear: randInt(2026, 2030),
          bankName: type === 'bank_account' ? pick(['Chase', 'BOA', 'Wells Fargo', 'Citi', 'HDFC']) : '',
          paypalEmail: type === 'paypal' ? `${creator.username}@paypal.com` : '',
          upiId: type === 'upi' ? `${creator.username}@upi` : '',
        },
        gateway: pick(['stripe', 'razorpay', 'manual']),
        isDefault: m === 0,
        isVerified: Math.random() < 0.8,
      });
    }
  }
  await PaymentMethod.insertMany(pmData);
  console.log(`   ✅ ${pmData.length} payment methods`);

  // ── 25. WITHDRAW REQUESTS (35) ─────────────────────────────────────────
  const wrData = [];
  for (let i = 0; i < 35; i++) {
    const creator = pick(paidCreators);
    const status = pick(['pending', 'processing', 'completed', 'rejected']);
    wrData.push({
      user: creator._id,
      amount: randFloat(25, 500),
      currency: 'USD',
      status,
      payoutMethod: pick(['bank_transfer', 'paypal', 'upi', 'stripe']),
      payoutDetails: {
        accountName: creator.displayName,
        paypalEmail: `${creator.username}@paypal.com`,
        bankName: pick(['Chase', 'BOA', 'HDFC', 'SBI']),
      },
      processedBy: status === 'completed' || status === 'rejected' ? admin._id : undefined,
      processedAt: status === 'completed' || status === 'rejected' ? daysAgo(randInt(0, 10)) : undefined,
      rejectionReason: status === 'rejected' ? pick(['Insufficient balance', 'Invalid payment details', 'Account under review']) : '',
      transactionRef: status === 'completed' ? `TXN_${uuid()}` : '',
      createdAt: daysAgo(randInt(0, 45)),
    });
  }
  await WithdrawRequest.insertMany(wrData);
  console.log(`   ✅ ${wrData.length} withdraw requests`);

  // ═══════════════════════════════════════════════════════════════════════════
  //  PHASE 6 — CONTENT & MODERATION
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n📝 PHASE 6 — Content & Moderation');

  // ── 26. BLOG POSTS (20) ────────────────────────────────────────────────
  const blogData = [];
  for (let i = 0; i < 20; i++) {
    const author = i < 5 ? admin : pick([...mods, ...paidCreators.slice(0, 3)]);
    const title = blogTitles[i % blogTitles.length];
    blogData.push({
      title,
      slug: slugify(title, { lower: true, strict: true }) + '-' + uuid(),
      content: `<h2>${title}</h2><p>This is a comprehensive guide covering ${title.toLowerCase()}. In the modern web development landscape, understanding these concepts is crucial for building scalable applications.</p><p>Key takeaways include performance optimization, security best practices, and architectural patterns that scale.</p><h3>Getting Started</h3><p>Before diving in, make sure you have Node.js 18+ installed along with npm or yarn. We'll be using several key packages throughout this tutorial.</p><p>The complete source code is available on GitHub. Feel free to fork and experiment!</p>`,
      excerpt: `A comprehensive guide to ${title.toLowerCase()} — covering best practices, optimization strategies, and real-world examples.`,
      coverImage: { url: `https://picsum.photos/seed/blog${i}/1200/630`, publicId: `blog/cover_${i}` },
      tags: Array.from({ length: randInt(2, 5) }, () => pick(tags)),
      category: pick(blogCategories),
      author: author._id,
      status: i < 18 ? 'published' : pick(['draft', 'archived']),
      viewsCount: randInt(100, 5000),
      likesCount: randInt(10, 300),
      commentsCount: randInt(5, 50),
      sharesCount: randInt(2, 40),
      isFeatured: i < 3,
      readTime: randInt(3, 15),
      createdAt: daysAgo(randInt(0, 90)),
    });
  }
  const createdBlogs = await BlogPost.insertMany(blogData);
  console.log(`   ✅ ${createdBlogs.length} blog posts`);

  // ── 27. REPORTS (60) ───────────────────────────────────────────────────
  const reportReasons = ['spam', 'nsfw', 'harassment', 'hate_speech', 'copyright', 'misinformation', 'other'];
  const reportsData = [];
  const reportSet = new Set();
  for (let i = 0; i < 60; i++) {
    const reporter = pick(allUsers);
    const isPostReport = Math.random() < 0.6;
    const isBlogReport = !isPostReport && Math.random() < 0.5;
    const post = isPostReport ? pick(createdPosts) : undefined;
    const blogPost = isBlogReport ? pick(createdBlogs) : undefined;
    const targetKey = post ? `p-${post._id}-${reporter._id}` : blogPost ? `b-${blogPost._id}-${reporter._id}` : `u-${i}-${reporter._id}`;

    if (reportSet.has(targetKey)) continue;
    reportSet.add(targetKey);

    const status = pick(['pending', 'pending', 'reviewed', 'resolved', 'dismissed']);
    reportsData.push({
      reporter: reporter._id,
      post: post?._id,
      blogPost: blogPost?._id,
      reportedUser: !post && !blogPost ? pick(allUsers.filter((u) => !u._id.equals(reporter._id)))._id : undefined,
      reason: pick(reportReasons),
      description: `Report #${i + 1}: Content violates community guidelines`,
      status,
      priority: pick(['low', 'medium', 'high', 'critical']),
      severity: randInt(1, 10),
      reviewedBy: ['reviewed', 'resolved'].includes(status) ? pick([admin, ...mods])._id : undefined,
      reviewedAt: ['reviewed', 'resolved'].includes(status) ? daysAgo(randInt(0, 5)) : undefined,
      reviewNotes: ['reviewed', 'resolved'].includes(status) ? 'Reviewed by moderation team' : undefined,
      actionTaken: status === 'resolved' ? pick(['removed', 'warned', 'hidden']) : 'none',
      createdAt: daysAgo(randInt(0, 60)),
    });
  }
  await Report.insertMany(reportsData);
  console.log(`   ✅ ${reportsData.length} reports`);

  // ── 28. LOGIN LOGS (1500) ──────────────────────────────────────────────
  const loginData = [];
  for (let i = 0; i < 1500; i++) {
    const user = pick(allUsers);
    loginData.push({
      user: user._id,
      email: user.email,
      ip: `${randInt(1, 255)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`,
      ipMasked: `${randInt(1, 255)}.${randInt(0, 255)}.xxx.xxx`,
      userAgent: `Mozilla/5.0 (${pick(oses)}) ${pick(browsers)}`,
      method: pick(['email', 'email', 'email', 'google', 'github']),
      success: Math.random() < 0.95,
      browser: pick(browsers),
      os: pick(oses),
      deviceType: pick(devices),
      country: pick(countries),
      city: pick(cities),
      region: pick(['California', 'London', 'Tokyo', 'Berlin', 'Mumbai', 'Ontario', 'NSW']),
      createdAt: daysAgo(randInt(0, 60)),
    });
  }
  await LoginLog.insertMany(loginData);
  console.log(`   ✅ ${loginData.length} login logs`);

  // ── 29. DAILY STATS (60 days) ──────────────────────────────────────────
  const dailyData = [];
  for (let d = 0; d < 60; d++) {
    const logins = randInt(30, 300);
    dailyData.push({
      date: dateStr(daysAgo(d)),
      newUsers: randInt(1, 20),
      logins,
      uniqueLogins: Math.floor(logins * randFloat(0.5, 0.8)),
      posts: randInt(5, 40),
      views: randInt(500, 10000),
      likes: randInt(50, 500),
      saves: randInt(10, 100),
      aiGenerations: randInt(0, 30),
      reports: randInt(0, 5),
      blogPosts: randInt(0, 3),
      comments: randInt(10, 80),
      loginsByMethod: { email: randInt(20, 200), google: randInt(5, 60), github: randInt(2, 20) },
      loginsByDevice: { desktop: randInt(15, 100), mobile: randInt(20, 150), tablet: randInt(3, 30), unknown: randInt(0, 10) },
      topCountries: countries.slice(0, 5).map((c) => ({ country: c, count: randInt(5, 60) })),
    });
  }
  await DailyStats.insertMany(dailyData);
  console.log(`   ✅ ${dailyData.length} daily stats records`);

  // ═══════════════════════════════════════════════════════════════════════════
  //  PHASE 7 — AI & AUDIT (NEW)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n🤖 PHASE 7 — AI & Audit');

  // ── 30. AI GENERATIONS (200) ───────────────────────────────────────────
  const aiData = [];
  const aiPosts = createdPosts.filter((p) => p.isAiGenerated);
  for (let i = 0; i < 200; i++) {
    const user = pick([...paidCreators, ...regularUsers.slice(0, 15)]);
    const status = pick(['completed', 'completed', 'completed', 'completed', 'failed', 'queued']);
    const style = pick(aiStyles);
    const model = pick(aiModels);
    aiData.push({
      user: user._id,
      prompt: pick(aiPrompts),
      negativePrompt: Math.random() < 0.4 ? pick(['blurry', 'low quality', 'text', 'watermark', 'distorted faces', 'bad anatomy']) : undefined,
      model,
      style,
      width: pick([512, 768, 1024]),
      height: pick([512, 768, 1024]),
      seed: randInt(100000, 999999),
      steps: pick([20, 25, 30, 40, 50]),
      cfgScale: pick([5, 7, 8, 10, 12]),
      resultImage: status === 'completed' ? {
        url: `https://picsum.photos/seed/ai${i}/1024/1024`,
        publicId: `ai/gen_${i}`,
      } : undefined,
      status,
      error: status === 'failed' ? pick(['Model timeout', 'Content filter triggered', 'GPU OOM', 'Rate limit exceeded']) : undefined,
      processingTime: status === 'completed' ? randInt(3000, 30000) : undefined,
      usedInPost: status === 'completed' && aiPosts.length > 0 && Math.random() < 0.3 ? pick(aiPosts)._id : undefined,
      createdAt: daysAgo(randInt(0, 60)),
    });
  }
  await AIGeneration.insertMany(aiData);
  console.log(`   ✅ ${aiData.length} AI generations`);

  // ── 31. AUDIT LOGS (100) ───────────────────────────────────────────────
  const auditActions = [
    'DELETE_POST', 'RESTORE_POST', 'MODERATE_POST', 'BAN_USER',
    'SUSPEND_USER', 'UPDATE_USER_ROLE', 'RESOLVE_REPORT',
    'DELETE_BLOG_POST', 'RESTORE_BLOG_POST', 'HARD_DELETE_POST',
  ];
  const auditData = [];
  for (let i = 0; i < 100; i++) {
    const action = pick(auditActions);
    const performer = pick([admin, ...mods]);
    let targetId, targetModel;
    if (['DELETE_POST', 'RESTORE_POST', 'MODERATE_POST', 'HARD_DELETE_POST'].includes(action)) {
      targetId = pick(createdPosts)._id;
      targetModel = 'Post';
    } else if (['DELETE_BLOG_POST', 'RESTORE_BLOG_POST'].includes(action)) {
      targetId = pick(createdBlogs)._id;
      targetModel = 'BlogPost';
    } else if (['BAN_USER', 'SUSPEND_USER', 'UPDATE_USER_ROLE'].includes(action)) {
      targetId = pick(regularUsers)._id;
      targetModel = 'User';
    } else {
      targetId = reportsData.length > 0 ? pick(reportsData)._id || pick(createdPosts)._id : pick(createdPosts)._id;
      targetModel = 'Report';
    }
    auditData.push({
      actionType: action,
      performedBy: performer._id,
      targetId,
      targetModel,
      metadata: {
        reason: pick(['Spam content', 'Policy violation', 'User request', 'Routine moderation', 'DMCA takedown']),
        previousState: pick(['active', 'published', 'user']),
        newState: pick(['deleted', 'suspended', 'restored', 'moderator']),
      },
      ipAddress: `${randInt(1, 255)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`,
      userAgent: `Mozilla/5.0 (${pick(oses)}) ${pick(browsers)}`,
      createdAt: daysAgo(randInt(0, 60)),
    });
  }
  await AuditLog.insertMany(auditData);
  console.log(`   ✅ ${auditData.length} audit logs`);

  // ═══════════════════════════════════════════════════════════════════════════
  //  SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n' + '═'.repeat(60));
  console.log('  ✅ SEED COMPLETE — All 29 collections populated');
  console.log('═'.repeat(60));
  console.log(`
   ┌─────────────────────────────────────────────────────┐
   │  Core                                                │
   │    Categories .............. ${String(createdCategories.length).padStart(5)}                  │
   │    Users ................... ${String(createdUsers.length).padStart(5)}                  │
   │    Posts ................... ${String(createdPosts.length).padStart(5)}                  │
   │    Comments ................ ${String(createdComments.length).padStart(5)}                  │
   │    Boards .................. ${String(createdBoards.length).padStart(5)}                  │
   │                                                       │
   │  Social                                               │
   │    Likes ................... ${String(likesData.length).padStart(5)}                  │
   │    Saves ................... ${String(savesData.length).padStart(5)}                  │
   │    Follows ................. ${String(followsData.length).padStart(5)}                  │
   │    Notifications ........... ${String(notifsData.length).padStart(5)}                  │
   │                                                       │
   │  Analytics                                            │
   │    Post Events ............. ${String(postEventsData.length).padStart(5)}                  │
   │    Post Analytics Daily .... ${String(padData.length).padStart(5)}                  │
   │    Creator Snapshots ....... ${String(snapshotsData.length).padStart(5)}                  │
   │    Content Metrics ......... ${String(metricsData.length).padStart(5)}                  │
   │                                                       │
   │  Creator                                              │
   │    Creator Profiles ........ ${String(profilesData.length).padStart(5)}                  │
   │    Creator Revenue ......... ${String(revenueData.length).padStart(5)}                  │
   │    Audience Demographics ... ${String(demoData.length).padStart(5)}                  │
   │    Activity Events ......... ${String(actEventsData.length).padStart(5)}                  │
   │    Scheduled Posts ......... ${String(scheduledData.length).padStart(5)}                  │
   │                                                       │
   │  Finance                                              │
   │    Advertisements .......... ${String(createdAds.length).padStart(5)}                  │
   │    Ad Click Events ......... ${String(adClickData.length).padStart(5)}                  │
   │    Affiliate Clicks ........ ${String(affData.length).padStart(5)}                  │
   │    Payments ................ ${String(createdPayments.length).padStart(5)}                  │
   │    Wallets ................. ${String(walletsData.length).padStart(5)}                  │
   │    Payment Methods ......... ${String(pmData.length).padStart(5)}                  │
   │    Withdraw Requests ....... ${String(wrData.length).padStart(5)}                  │
   │                                                       │
   │  Content & Moderation                                 │
   │    Blog Posts .............. ${String(createdBlogs.length).padStart(5)}                  │
   │    Reports ................. ${String(reportsData.length).padStart(5)}                  │
   │    Login Logs .............. ${String(loginData.length).padStart(5)}                  │
   │    Daily Stats ............. ${String(dailyData.length).padStart(5)}                  │
   │                                                       │
   │  AI & Audit                                           │
   │    AI Generations .......... ${String(aiData.length).padStart(5)}                  │
   │    Audit Logs .............. ${String(auditData.length).padStart(5)}                  │
   │                                                       │
   │  ⏱  Time: ${elapsed}s                                     │
   └─────────────────────────────────────────────────────┘
  `);

  await mongoose.disconnect();
  console.log('📦 Disconnected from MongoDB');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

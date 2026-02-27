/**
 * Massive Seed Script — ~1000+ records across all collections
 * 
 * Generates:
 *   50 users  ·  12 categories  ·  800 posts  ·  150 comments
 *   60 boards  ·  500 likes  ·  300 saves  ·  200 follows  ·  200 notifications
 *
 * Run:  node src/seeds/seed-massive.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');

const User = require('../models/User');
const Category = require('../models/Category');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Board = require('../models/Board');
const Notification = require('../models/Notification');
const { Like, Save, Follow } = require('../models/Interaction');

// ─── helpers ────────────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const chance = (pct) => Math.random() < pct;
const uniqueSlug = (title, idx) =>
  slugify(title, { lower: true, strict: true }) + '-' + Date.now().toString(36) + idx;

// ─── data pools ─────────────────────────────────────────────────────
const categories = [
  { name: 'Technology', slug: 'technology', icon: '💻', color: '#6366f1', description: 'Tech gadgets and software', order: 1 },
  { name: 'Fashion', slug: 'fashion', icon: '👗', color: '#ec4899', description: 'Clothing and accessories', order: 2 },
  { name: 'Home & Living', slug: 'home-living', icon: '🏠', color: '#f59e0b', description: 'Home decor and furniture', order: 3 },
  { name: 'Art & Design', slug: 'art-design', icon: '🎨', color: '#8b5cf6', description: 'Art prints and design tools', order: 4 },
  { name: 'Photography', slug: 'photography', icon: '📸', color: '#14b8a6', description: 'Cameras and photography gear', order: 5 },
  { name: 'Food & Drink', slug: 'food-drink', icon: '🍕', color: '#ef4444', description: 'Gourmet food and beverages', order: 6 },
  { name: 'Travel', slug: 'travel', icon: '✈️', color: '#3b82f6', description: 'Travel gear and accessories', order: 7 },
  { name: 'Books', slug: 'books', icon: '📚', color: '#a855f7', description: 'Books and reading material', order: 8 },
  { name: 'Fitness', slug: 'fitness', icon: '💪', color: '#22c55e', description: 'Workout equipment and supplements', order: 9 },
  { name: 'Electronics', slug: 'electronics', icon: '🔌', color: '#f97316', description: 'Electronic devices and accessories', order: 10 },
  { name: 'Beauty', slug: 'beauty', icon: '💄', color: '#f472b6', description: 'Skincare and beauty products', order: 11 },
  { name: 'Automotive', slug: 'automotive', icon: '🚗', color: '#64748b', description: 'Car accessories and parts', order: 12 },
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
  'Tech reviewer & gadget collector',
  'Fashion blogger • Sustainable style advocate',
  'Illustrator & concept artist 🎨',
  'Coffee addict ☕ • Travel junkie',
  'Minimalist designer from Tokyo',
  'Street photographer • Film lover',
  'Interior designer • Plant parent 🌿',
  'AI researcher & creative coder',
  'Vintage collector • Thrift enthusiast',
  'Food blogger • Home chef 🍳',
  'Fitness coach • Wellness advocate',
  'Graphic designer by day, gamer by night 🎮',
  'Bookworm • Aspiring novelist 📖',
  'Music producer & sound designer 🎧',
  'Architect • Loves brutalist design',
  'Drone pilot & aerial photographer',
  'Sustainable living advocate 🌱',
  'Cat lover • Pottery hobbyist',
  'Sneakerhead • Streetwear collector',
  'Digital marketer & brand strategist',
  'Marine biologist turned underwater photographer',
  'Game developer • Pixel art enthusiast',
];

const locations = [
  'San Francisco, CA', 'New York, NY', 'Los Angeles, CA', 'Austin, TX',
  'Seattle, WA', 'Portland, OR', 'Chicago, IL', 'Miami, FL',
  'Denver, CO', 'Boston, MA', 'London, UK', 'Tokyo, Japan',
  'Berlin, Germany', 'Paris, France', 'Toronto, Canada', 'Sydney, Australia',
  'Amsterdam, Netherlands', 'Seoul, South Korea', 'Barcelona, Spain', 'Melbourne, Australia',
];

// 100 post title templates per category — combined pool
const postTitles = [
  // Technology
  'MacBook Pro M4 Ultra Setup Tour', 'Best Mechanical Keyboards 2026', 'Smart Home Dashboard Build',
  'AI-Powered Code Editor Review', 'Raspberry Pi Retro Arcade', 'VR Headset Comparison Guide',
  'Minimal Tech Desk Setup', 'Custom Water-Cooled PC Build', 'Solar Panel Home Installation',
  'Robot Vacuum Showdown', 'Wireless Charging Station DIY', 'Smart Watch Face Design',
  'USB-C Hub Ultimate Guide', 'Home Server Setup Tutorial', 'Neural Interface Prototype',
  'Foldable Phone Long-Term Review', '3D Printer Project Ideas', 'E-Ink Display Custom Dashboard',
  // Fashion
  'Capsule Wardrobe Essentials', 'Vintage Denim Collection', 'Sustainable Fashion Brands Guide',
  'Minimalist Jewelry Picks', 'Streetwear Layering Techniques', 'Luxury Watch Showcase',
  'Designer Sneaker Collection', 'Linen Summer Collection', 'Handmade Leather Goods',
  'Thrifted Outfit Inspiration', 'Y2K Fashion Revival Looks', 'Monochrome Outfit Ideas',
  'Upcycled Fashion Projects', 'Silk Scarf Styling Tips', 'Winter Coat Essentials',
  'Tailored Suit Customization', 'Bohemian Accessories Haul', 'Vintage Sunglasses Guide',
  // Home & Living
  'Japandi Interior Design Ideas', 'Indoor Herb Garden Setup', 'Smart Lighting Ambience Guide',
  'Cozy Reading Nook Design', 'Kitchen Organization Hacks', 'Modern Planter Collection',
  'DIY Concrete Furniture', 'Scandinavian Living Room Tour', 'Wall Art Gallery Arrangement',
  'Bathroom Renovation Reveal', 'Custom Bookshelf Build', 'Candle Making Workshop',
  'Tiny Home Interior Tour', 'Mid-Century Modern Decor', 'Floating Shelf Installation',
  'Loft Conversion Before & After', 'Smart Thermostat Comparison', 'Handmade Ceramic Planters',
  // Art & Design
  'Digital Illustration Process', 'Procreate Brush Collection', 'Typography Poster Series',
  'Watercolor Painting Tutorial', 'Logo Design Case Study', 'Abstract Art Commission',
  'Pixel Art Character Sheet', 'Brand Identity Mockup', 'Risograph Print Collection',
  'Isometric Illustration Pack', 'Calligraphy Practice Sheets', 'Generative Art with Code',
  'Color Palette Inspiration', 'Packaging Design Concept', 'Infographic Design Template',
  'Hand-Lettered Quote Series', 'UI Kit for Mobile Apps', 'Album Cover Art Process',
  // Photography
  'Golden Hour Portrait Session', 'Street Photography in Tokyo', 'Astrophotography Guide',
  'Macro Flower Photography', 'Drone Aerial Landscapes', 'Film vs Digital Comparison',
  'Moody Cityscape Collection', 'Food Photography Lighting', 'Minimalist Architecture Shots',
  'Underwater Coral Reef Photos', 'Black & White Portrait Series', 'Night Photography Tips',
  'Travel Photo Journal — Iceland', 'Long Exposure Waterfall Shots', 'Pet Photography Session',
  'Wedding Photography Portfolio', 'Vintage Lens Bokeh Tests', 'Infrared Photography Results',
  // Food & Drink
  'Artisan Sourdough Recipe', 'Japanese Ramen From Scratch', 'Specialty Coffee Brewing Guide',
  'Homemade Pasta Varieties', 'Vegan Dessert Collection', 'Charcuterie Board Inspiration',
  'Matcha Latte Art Tutorial', 'BBQ Smoked Brisket Process', 'Farm-to-Table Salad Recipes',
  'Craft Beer Tasting Notes', 'French Pastry Techniques', 'Sushi Rolling Masterclass',
  'Cocktail Recipe Collection', 'Fermented Foods Guide', 'Meal Prep Sunday Ideas',
  'Thai Street Food Favorites', 'Chocolate Truffle Making', 'Cold Brew Setup at Home',
  // Travel
  'Patagonia Hiking Adventure', 'Tokyo Street Style Guide', 'Northern Lights in Norway',
  'Bali Temple Photography', 'Iceland Ring Road Trip', 'Safari Wildlife Photography',
  'Greek Island Hopping Guide', 'NYC Hidden Gems Tour', 'Swiss Alps Train Journey',
  'Morocco Desert Camping', 'Scotland Highland Road Trip', 'Vietnam Street Food Tour',
  'New Zealand Backpacking', 'Kyoto Cherry Blossom Season', 'Portugal Coastal Walk',
  'Cuba Vintage Car Tour', 'Australian Outback Adventure', 'Canada National Parks Guide',
  // Books
  'Must-Read Sci-Fi Collection', 'Bookshelf Organization Ideas', 'Graphic Novel Recommendations',
  'Journaling Setup & Templates', 'Book Cover Design Showcase', 'Classic Literature Collection',
  'Reading Nook Setup Tour', 'Book Subscription Box Review', 'Poetry Collection Favorites',
  'Philosophy Book Essentials', 'Manga Art Style Analysis', 'Rare First Edition Display',
  'Book Binding DIY Project', 'Audiobook Setup & Picks', 'Cookbook Collection Tour',
  'Indie Bookstore Favorites', 'Book Photography Tips', 'Study Notes Organization',
  // Fitness
  'Home Gym Setup Guide', 'Yoga Mat & Props Review', 'Running Shoe Comparison 2026',
  'Calisthenics Park Workout', 'Meal Prep for Athletes', 'Cycling Gear Essentials',
  'Hiking Trail Photography', 'Swimming Pool Workout Routine', 'Rock Climbing Gear Review',
  'Marathon Training Plan', 'Resistance Band Exercises', 'Gym Bag Essentials List',
  'Trail Running Shoe Review', 'Boxing Home Training Setup', 'Stretching Routine Guide',
  'Fitness Tracker Comparison', 'Protein Shake Recipes', 'Outdoor HIIT Workout Plan',
  // Electronics
  'Wireless Earbuds Showdown', 'Smart Speaker Setup Guide', 'Camera Lens Collection Tour',
  'Portable Monitor Review', 'Gaming Mouse Comparison', 'Streaming Audio Setup',
  'Lightning Cable Alternatives', 'Power Bank Mega Test', 'Action Camera Footage Test',
  'Bluetooth Keyboard Picks', 'Home Theater Installation', 'Retro Console Collection',
  'LED Strip Light Ideas', 'Noise Cancelling Headphones', 'External SSD Speed Test',
  'Projector Room Setup', 'Smart Plug Automation', 'Tablet Drawing Review',
  // Beauty
  'Korean Skincare Routine', 'Minimal Makeup Collection', 'Nail Art Design Ideas',
  'Fragrance Collection Tour', 'Hair Care Product Lineup', 'DIY Face Mask Recipes',
  'Lip Color Swatches & Review', 'Sunscreen Comparison Guide', 'Clean Beauty Brand Picks',
  'Eyeshadow Palette Collection', 'Skincare Fridge Tour', 'Organic Essential Oils Guide',
  'Haircut Style Inspiration', 'Body Care Routine Steps', 'Perfume Layering Technique',
  'Brow Shaping Tutorial', 'Sheet Mask Comparison', 'Cruelty-Free Product Swap',
  // Automotive
  'JDM Classic Car Collection', 'Tesla Cybertruck Review', 'Custom Motorcycle Build',
  'Detailing Products Guide', 'Vintage Car Interior Restore', 'Electric SUV Comparison',
  'Dashboard Camera Review', 'Car Camping Setup Ideas', 'Track Day Preparation',
  'Wheel & Tire Showcase', 'Car Audio System Upgrade', 'Off-Road Trail Adventures',
  'EV Charging Station Map', 'Drag Race Photo Series', 'Classic VW Bus Restoration',
  'Car Paint Color Samples', 'Performance Exhaust Sound', 'Winter Tire Recommendation',
  // Misc/crossover
  'Desk Setup Productivity Tips', 'Gift Guide for Creatives', 'Flat Lay Photography Tips',
  'Mood Board Design Process', 'Color Theory in Design', 'Workspace Tour & Gear List',
  'Beginner Camera Buying Guide', 'Aesthetic Stationery Haul', 'Developer Desk Accessories',
  'Studio Apartment Makeover', 'Content Creator Starter Kit', 'Digital Art Tablet Setup',
  'Acoustic Treatment Guide', 'Podcast Recording Setup', 'Home Office Cable Management',
  'Freelancer Toolkit Review', 'Vintage Poster Collection', 'LED Neon Sign DIY',
  'Smart Mirror Build Project', 'Custom Keyboard Switches',
];

const tagPool = [
  'trending', 'curated', 'minimal', 'aesthetic', 'diy', 'review', 'howto', 'inspiration',
  'design', 'tech', 'fashion', 'home', 'art', 'photo', 'food', 'travel', 'books', 'fitness',
  'gadgets', 'vintage', 'modern', 'sustainable', 'luxury', 'budget', 'creative', 'handmade',
  'digital', 'analog', 'organic', 'premium', 'essentials', 'collection', 'setup', 'tutorial',
  'guide', 'comparison', 'unboxing', 'timelapse', 'asmr', 'satisfying', 'cozy', 'moody',
  'colorful', 'monochrome', 'abstract', 'portrait', 'landscape', 'macro', 'street', 'nature',
];

const commentTexts = [
  'This is absolutely stunning! 🔥',
  'Where did you get this? I need one!',
  'Love the aesthetic — saving this for later.',
  'Great composition and color palette!',
  'This is exactly what I was looking for.',
  'Incredible quality, thanks for sharing!',
  'The details are amazing 👀',
  'Added this to my wish list immediately.',
  'How long did this take to make?',
  'This deserves way more likes!',
  'Can you do a tutorial on this?',
  'Bookmarked for my next project 📌',
  'The lighting in this is chef\'s kiss 🤌',
  'I\'ve been looking for something like this!',
  'Such a clean and minimal look.',
  'This inspired me to start my own project!',
  'Perfect color combination 💜',
  'Anyone know a budget alternative?',
  'This belongs in a museum honestly.',
  'Following for more content like this!',
  'The attention to detail is unreal.',
  'My jaw literally dropped 😍',
  'This is giving me so many ideas!',
  'Take my money already 💸',
  'Quality content right here.',
  'I tried this and it turned out amazing!',
  'This is next level creativity.',
  'Shared this with all my friends!',
  'The vibes are immaculate ✨',
  'Need a full review on this please!',
  'Simple yet so effective. Great work!',
  'This changed my whole perspective.',
  'Can\'t stop looking at this.',
  'The best one I\'ve seen this year.',
  'More of this content please! 🙏',
  'Underrated post right here.',
  'This is what peak design looks like.',
  'Obsessed with everything about this.',
  'You have incredible taste!',
  'Definitely worth the investment.',
];

const boardNames = [
  'Dream Setup', 'Style Inspo', 'Want List', 'Design References', 'Gift Ideas',
  'Home Renovation', 'Travel Bucket List', 'Fitness Goals', 'Recipe Collection',
  'Art Inspiration', 'Tech Wishlist', 'Fashion Mood Board', 'Photography Ideas',
  'Book List', 'Shop Later', 'DIY Projects', 'Color Palettes', 'Wedding Planning',
  'Apartment Decor', 'Minimalist Living', 'Car Goals', 'Beauty Routine',
  'Coffee Corner', 'Garden Ideas', 'Studio Setup', 'Brand Board', 'Portfolio Refs',
  'Workspace Goals', 'Outfit Inspiration', 'Camping Gear',
];

const descriptions = [
  'Discover something amazing — curated for quality and style.',
  'A hand-picked selection for the discerning eye.',
  'Perfectly curated with attention to every detail.',
  'Quality meets aesthetics in this incredible piece.',
  'An essential addition to any collection.',
  'Designed with passion and crafted with care.',
  'The perfect blend of form and function.',
  'Minimalist design at its absolute finest.',
  'Everything you need, nothing you don\'t.',
  'Elevate your everyday with this stunning pick.',
  'Timeless design meets modern functionality.',
  'A true masterpiece of creative expression.',
  'Simple, elegant, and beautifully executed.',
  'The ultimate guide for enthusiasts and beginners alike.',
  'Pushing boundaries of what\'s possible.',
];

// ─── main seed function ─────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB\n');

    // Clear everything
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
      Board.deleteMany({}),
      Like.deleteMany({}),
      Save.deleteMany({}),
      Follow.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('🗑️  Cleared all collections\n');

    // ── 1. Categories (12) ──────────────────────────────────────────
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Categories: ${createdCategories.length}`);

    // ── 2. Users (50) ───────────────────────────────────────────────
    const hashedPw = await bcrypt.hash('demo123', 12);

    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@picup.app',
      password: 'admin123',
      displayName: 'PicUp Admin',
      role: 'admin',
      isVerified: true,
      bio: 'Platform administrator • Building E.D.I.T.H',
      location: 'San Francisco, CA',
      followersCount: randInt(100, 500),
      followingCount: randInt(10, 50),
    });

    const userDocs = [];
    const usedUsernames = new Set(['admin']);

    for (let i = 0; i < 49; i++) {
      const first = firstNames[i % firstNames.length];
      const last = lastNames[i % lastNames.length];
      let base = `${first.toLowerCase()}_${last.toLowerCase()}`;
      if (usedUsernames.has(base)) base += i;
      usedUsernames.add(base);

      userDocs.push({
        username: base,
        email: `${base}@demo.com`,
        password: hashedPw,
        displayName: `${first} ${last}`,
        bio: pick(bios),
        avatar: `https://i.pravatar.cc/300?u=${base}`,
        location: pick(locations),
        website: chance(0.4) ? `https://${base}.dev` : '',
        isVerified: chance(0.6),
        role: i < 2 ? 'moderator' : 'user',
        followersCount: randInt(5, 2000),
        followingCount: randInt(5, 500),
        postsCount: 0, // will update after posts
        loginCount: randInt(1, 200),
        lastLogin: new Date(Date.now() - randInt(0, 30 * 86400000)),
      });
    }

    const createdUsers = await User.insertMany(userDocs);
    const allUsers = [adminUser, ...createdUsers];
    console.log(`✅ Users: ${allUsers.length}`);

    // ── 3. Posts (800) ──────────────────────────────────────────────
    const postDocs = [];
    const postCount = 800;
    const heightPool = [400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000, 1050, 1100];

    for (let i = 0; i < postCount; i++) {
      const title = postTitles[i % postTitles.length] + (i >= postTitles.length ? ` #${Math.floor(i / postTitles.length) + 1}` : '');
      const h = pick(heightPool);
      const w = 800;
      const author = pick(allUsers);
      const cat = createdCategories[i % createdCategories.length];
      const numTags = randInt(2, 5);
      const tags = [cat.slug];
      while (tags.length < numTags) {
        const t = pick(tagPool);
        if (!tags.includes(t)) tags.push(t);
      }

      const hasPrice = chance(0.45);
      const isFeatured = chance(0.08);
      const isAi = chance(0.12);

      // Spread createdAt over the last 90 days for realistic feed
      const daysAgo = randInt(0, 90);
      const hoursAgo = randInt(0, 23);
      const createdAt = new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000);

      postDocs.push({
        title,
        slug: uniqueSlug(title, i),
        description: pick(descriptions),
        image: {
          url: `https://picsum.photos/seed/edith${i}/${w}/${h}`,
          width: w,
          height: h,
        },
        productUrl: hasPrice ? `https://example.com/product/${i + 1}` : '',
        price: hasPrice ? { amount: parseFloat((Math.random() * 500 + 5).toFixed(2)), currency: 'USD' } : undefined,
        tags,
        category: cat._id,
        author: author._id,
        status: 'published',
        isFeatured,
        isAiGenerated: isAi,
        aiMetadata: isAi ? { prompt: `Generate a ${cat.name.toLowerCase()} concept`, model: 'dall-e-3', style: pick(['vivid', 'natural']) } : undefined,
        likesCount: randInt(0, 800),
        savesCount: randInt(0, 200),
        viewsCount: randInt(50, 10000),
        commentsCount: 0, // updated later
        clicksCount: randInt(0, 500),
        sharesCount: randInt(0, 100),
        createdAt,
        updatedAt: createdAt,
      });
    }

    const createdPosts = await Post.insertMany(postDocs);
    console.log(`✅ Posts: ${createdPosts.length}`);

    // Update user postsCount
    const postsByAuthor = {};
    createdPosts.forEach((p) => {
      const id = p.author.toString();
      postsByAuthor[id] = (postsByAuthor[id] || 0) + 1;
    });
    await Promise.all(
      Object.entries(postsByAuthor).map(([userId, count]) =>
        User.updateOne({ _id: userId }, { postsCount: count })
      )
    );

    // Update category postsCount
    const postsByCat = {};
    createdPosts.forEach((p) => {
      const id = p.category.toString();
      postsByCat[id] = (postsByCat[id] || 0) + 1;
    });
    await Promise.all(
      Object.entries(postsByCat).map(([catId, count]) =>
        Category.updateOne({ _id: catId }, { postsCount: count })
      )
    );

    // ── 4. Comments (150) ───────────────────────────────────────────
    const commentDocs = [];
    const commentedPosts = new Set();

    for (let i = 0; i < 150; i++) {
      const post = pick(createdPosts);
      commentedPosts.add(post._id.toString());
      commentDocs.push({
        text: pick(commentTexts),
        post: post._id,
        user: pick(allUsers)._id,
        likesCount: randInt(0, 30),
        createdAt: new Date(Date.now() - randInt(0, 60) * 86400000),
      });
    }

    const createdComments = await Comment.insertMany(commentDocs);
    console.log(`✅ Comments: ${createdComments.length}`);

    // Add some replies (nested comments)
    const replyDocs = [];
    for (let i = 0; i < 40; i++) {
      const parent = pick(createdComments);
      replyDocs.push({
        text: pick(commentTexts),
        post: parent.post,
        user: pick(allUsers)._id,
        parentComment: parent._id,
        likesCount: randInt(0, 10),
        createdAt: new Date(Date.now() - randInt(0, 30) * 86400000),
      });
    }
    const createdReplies = await Comment.insertMany(replyDocs);
    console.log(`✅ Replies: ${createdReplies.length}`);

    // Update posts commentsCount
    const commentsByPost = {};
    [...createdComments, ...createdReplies].forEach((c) => {
      const id = c.post.toString();
      commentsByPost[id] = (commentsByPost[id] || 0) + 1;
    });
    await Promise.all(
      Object.entries(commentsByPost).map(([postId, count]) =>
        Post.updateOne({ _id: postId }, { commentsCount: count })
      )
    );

    // ── 5. Boards (60) ──────────────────────────────────────────────
    const boardDocs = [];
    for (let i = 0; i < 60; i++) {
      const user = pick(allUsers);
      const numPosts = randInt(3, 15);
      const boardPosts = [];
      for (let j = 0; j < numPosts; j++) {
        const p = pick(createdPosts);
        if (!boardPosts.includes(p._id)) boardPosts.push(p._id);
      }
      const name = boardNames[i % boardNames.length] + (i >= boardNames.length ? ` ${Math.floor(i / boardNames.length) + 1}` : '');
      boardDocs.push({
        name,
        description: `My curated ${name.toLowerCase()} collection`,
        user: user._id,
        posts: boardPosts,
        coverImage: boardPosts.length > 0 ? `https://picsum.photos/seed/board${i}/400/300` : '',
        isPrivate: chance(0.15),
        postsCount: boardPosts.length,
      });
    }

    const createdBoards = await Board.insertMany(boardDocs);
    console.log(`✅ Boards: ${createdBoards.length}`);

    // ── 6. Likes (500) ──────────────────────────────────────────────
    const likeDocs = [];
    const likeSet = new Set();
    let likeAttempts = 0;

    while (likeDocs.length < 500 && likeAttempts < 2000) {
      likeAttempts++;
      const user = pick(allUsers);
      const post = pick(createdPosts);
      const key = `${user._id}_${post._id}`;
      if (!likeSet.has(key)) {
        likeSet.add(key);
        likeDocs.push({ user: user._id, post: post._id });
      }
    }

    const createdLikes = await Like.insertMany(likeDocs);
    console.log(`✅ Likes: ${createdLikes.length}`);

    // ── 7. Saves (300) ──────────────────────────────────────────────
    const saveDocs = [];
    const saveSet = new Set();
    let saveAttempts = 0;

    while (saveDocs.length < 300 && saveAttempts < 1500) {
      saveAttempts++;
      const user = pick(allUsers);
      const post = pick(createdPosts);
      const key = `${user._id}_${post._id}`;
      if (!saveSet.has(key)) {
        saveSet.add(key);
        // Optionally assign to a board owned by this user
        const userBoards = createdBoards.filter((b) => b.user.toString() === user._id.toString());
        saveDocs.push({
          user: user._id,
          post: post._id,
          board: userBoards.length > 0 && chance(0.6) ? pick(userBoards)._id : undefined,
        });
      }
    }

    const createdSaves = await Save.insertMany(saveDocs);
    console.log(`✅ Saves: ${createdSaves.length}`);

    // ── 8. Follows (200) ────────────────────────────────────────────
    const followDocs = [];
    const followSet = new Set();
    let followAttempts = 0;

    while (followDocs.length < 200 && followAttempts < 1000) {
      followAttempts++;
      const follower = pick(allUsers);
      const following = pick(allUsers);
      if (follower._id.toString() === following._id.toString()) continue;
      const key = `${follower._id}_${following._id}`;
      if (!followSet.has(key)) {
        followSet.add(key);
        followDocs.push({ follower: follower._id, following: following._id });
      }
    }

    const createdFollows = await Follow.insertMany(followDocs);
    console.log(`✅ Follows: ${createdFollows.length}`);

    // ── 9. Notifications (200) ──────────────────────────────────────
    const notifTypes = ['like', 'comment', 'follow', 'save', 'mention', 'system'];
    const notifMessages = {
      like: 'liked your post',
      comment: 'commented on your post',
      follow: 'started following you',
      save: 'saved your post',
      mention: 'mentioned you in a comment',
      system: 'Welcome to E.D.I.T.H! Start exploring and sharing.',
    };

    const notifDocs = [];
    for (let i = 0; i < 200; i++) {
      const type = pick(notifTypes);
      const sender = pick(allUsers);
      let recipient = pick(allUsers);
      while (recipient._id.toString() === sender._id.toString()) {
        recipient = pick(allUsers);
      }

      const notif = {
        recipient: recipient._id,
        sender: type !== 'system' ? sender._id : undefined,
        type,
        message: notifMessages[type],
        isRead: chance(0.5),
        createdAt: new Date(Date.now() - randInt(0, 30) * 86400000),
      };

      if (['like', 'comment', 'save', 'mention'].includes(type)) {
        notif.post = pick(createdPosts)._id;
      }
      if (type === 'comment' || type === 'mention') {
        notif.comment = pick(createdComments)._id;
      }

      notifDocs.push(notif);
    }

    const createdNotifs = await Notification.insertMany(notifDocs);
    console.log(`✅ Notifications: ${createdNotifs.length}`);

    // ── Summary ─────────────────────────────────────────────────────
    const total =
      allUsers.length +
      createdCategories.length +
      createdPosts.length +
      createdComments.length +
      createdReplies.length +
      createdBoards.length +
      createdLikes.length +
      createdSaves.length +
      createdFollows.length +
      createdNotifs.length;

    console.log('\n' + '═'.repeat(50));
    console.log(`🎉 Database seeded with ${total} total records!`);
    console.log('═'.repeat(50));
    console.log(`   Users:          ${allUsers.length}`);
    console.log(`   Categories:     ${createdCategories.length}`);
    console.log(`   Posts:          ${createdPosts.length}`);
    console.log(`   Comments:       ${createdComments.length + createdReplies.length}`);
    console.log(`   Boards:         ${createdBoards.length}`);
    console.log(`   Likes:          ${createdLikes.length}`);
    console.log(`   Saves:          ${createdSaves.length}`);
    console.log(`   Follows:        ${createdFollows.length}`);
    console.log(`   Notifications:  ${createdNotifs.length}`);
    console.log('═'.repeat(50));
    console.log('\n🔑 Admin login:  admin@picup.app / admin123');
    console.log('🔑 Demo login:   emma_smith@demo.com / demo123');
    console.log('                 (any user: <username>@demo.com / demo123)\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();

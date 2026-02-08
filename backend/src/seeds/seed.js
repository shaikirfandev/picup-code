require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');
const User = require('../models/User');
const Category = require('../models/Category');
const Post = require('../models/Post');

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

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Post.deleteMany({}),
    ]);

    // Create categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories`);

    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@picup.app',
      password: 'admin123',
      displayName: 'PicUp Admin',
      role: 'admin',
      isVerified: true,
      bio: 'Platform administrator',
    });
    console.log('✅ Created admin user (admin@picup.app / admin123)');

    // Create demo users
    const demoUsers = await User.insertMany([
      {
        username: 'sarah_design',
        email: 'sarah@demo.com',
        password: await bcrypt.hash('demo123', 12),
        displayName: 'Sarah Chen',
        bio: 'UI/UX Designer • Loves minimal aesthetics',
        avatar: 'https://i.pravatar.cc/300?u=sarah',
        isVerified: true,
      },
      {
        username: 'alex_tech',
        email: 'alex@demo.com',
        password: await bcrypt.hash('demo123', 12),
        displayName: 'Alex Rivera',
        bio: 'Tech enthusiast • Gadget reviewer',
        avatar: 'https://i.pravatar.cc/300?u=alex',
        isVerified: true,
      },
      {
        username: 'mia_photos',
        email: 'mia@demo.com',
        password: await bcrypt.hash('demo123', 12),
        displayName: 'Mia Thompson',
        bio: 'Photographer • Digital nomad 🌍',
        avatar: 'https://i.pravatar.cc/300?u=mia',
      },
    ]);
    console.log(`✅ Created ${demoUsers.length} demo users`);

    // Create demo posts
    const samplePosts = [];
    const authors = [adminUser, ...demoUsers];
    const heights = [600, 800, 700, 900, 500, 750, 850, 650, 550, 950];
    const titles = [
      'Minimal Desk Setup for Productivity',
      'Vintage Film Camera Collection',
      'Handcrafted Ceramic Vases',
      'Modern Architecture Photography',
      'Organic Skincare Essentials',
      'Smart Home Devices 2026',
      'Abstract Digital Art Print',
      'Cozy Reading Nook Ideas',
      'Professional Drone Camera',
      'Artisan Coffee Brewing Kit',
      'Sustainable Fashion Picks',
      'Mountain Trail Running Shoes',
      'Minimalist Watch Collection',
      'Indoor Plant Arrangement',
      'Premium Wireless Earbuds',
      'Hand-Lettered Typography',
      'Gourmet Chocolate Box',
      'Yoga Mat & Accessories',
      'Retro Gaming Console',
      'Travel Backpack Review',
      'Japanese Stationery Set',
      'Smart LED Light Strips',
      'Watercolor Art Supplies',
      'Espresso Machine Guide',
    ];

    for (let i = 0; i < titles.length; i++) {
      const h = heights[i % heights.length];
      const author = authors[i % authors.length];
      const cat = createdCategories[i % createdCategories.length];

      samplePosts.push({
        title: titles[i],
        slug: slugify(titles[i], { lower: true, strict: true }) + '-' + Date.now().toString(36) + i,
        description: `Discover ${titles[i].toLowerCase()} - curated for quality and style. Perfect addition to your collection.`,
        image: {
          url: `https://picsum.photos/seed/picup${i}/800/${h}`,
          width: 800,
          height: h,
        },
        productUrl: `https://example.com/product/${i + 1}`,
        price: Math.random() > 0.3 ? { amount: Math.floor(Math.random() * 200) + 10, currency: 'USD' } : undefined,
        tags: ['trending', cat.slug, 'curated'],
        category: cat._id,
        author: author._id,
        status: 'published',
        likesCount: Math.floor(Math.random() * 500),
        viewsCount: Math.floor(Math.random() * 2000),
        commentsCount: Math.floor(Math.random() * 50),
      });
    }

    const createdPosts = await Post.insertMany(samplePosts);
    console.log(`✅ Created ${createdPosts.length} demo posts`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('Admin login: admin@picup.app / admin123');
    console.log('Demo login: sarah@demo.com / demo123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();

#!/usr/bin/env node

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const slugify = require('slugify');

const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Post = require('../models/Post');
const Board = require('../models/Board');
const { Like, Save, Follow } = require('../models/Interaction');

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sample = (arr, count) => [...arr].sort(() => Math.random() - 0.5).slice(0, count);

const featuredTopics = [
  'Graphic Design', 'Art', 'UI/UX', 'Interior Design', 'Typography', 'Nature',
  'Fashion', 'Architecture', 'Spirituality', 'Motion', 'Branding', 'Cinema',
  'Portraiture', 'Home Decor', 'Quotes', 'Love', 'Technology', 'Archaeology',
];

// Mirrors Cosmos home structure: selected clusters + elements
const cosmosHomeData = {
  selectedByCosmos: [
    { title: 'earth', owner: { username: 'kepler', displayName: 'Kepler' }, topic: 'Nature', coverUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=900&fit=crop' },
    { title: 'sobremesa', owner: { username: 'namphuongnguyen', displayName: 'Nam Phuong Nguyen' }, topic: 'Home Decor', coverUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&h=900&fit=crop' },
    { title: 'tahitian vanilla', owner: { username: 'seamushoward', displayName: 'Seamus Howard' }, topic: 'Fashion', coverUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&h=900&fit=crop' },
    { title: 'frutiger aero', owner: { username: 'cosmos', displayName: 'Cosmos' }, topic: 'Graphic Design', coverUrl: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200&h=900&fit=crop' },
    { title: 'design', owner: { username: 'ema', displayName: 'Ema' }, topic: 'UI/UX', coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=900&fit=crop' },
    { title: 'sharp', owner: { username: 'eth', displayName: 'Eth' }, topic: 'Branding', coverUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&h=900&fit=crop' },
    { title: 'sol', owner: { username: 'solfree', displayName: 'Solfree' }, topic: 'Spirituality', coverUrl: 'https://images.unsplash.com/photo-1470115636492-6d2b56f9146d?w=1200&h=900&fit=crop' },
    { title: 'runway invitations', owner: { username: 'tania', displayName: 'Tania' }, topic: 'Fashion', coverUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&h=900&fit=crop' },
    { title: 'fierce piercings', owner: { username: 'piercehouse', displayName: 'Pierce House' }, topic: 'Portraiture', coverUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1200&h=900&fit=crop' },
    { title: 'strange games', owner: { username: 'theplace', displayName: 'The Place' }, topic: 'Motion', coverUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&h=900&fit=crop' },
    { title: 'third place', owner: { username: 'loremipsumzoe', displayName: 'Zoe Ipsum' }, topic: 'Interior Design', coverUrl: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=1200&h=900&fit=crop' },
    { title: 'study of form', owner: { username: 'doublekick', displayName: 'Doublekick' }, topic: 'Art', coverUrl: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&h=900&fit=crop' },
  ],
  elements: [
    { sourceType: 'image', title: 'Devotions', sourceAuthor: 'Mary Oliver', imageUrl: 'https://images.unsplash.com/photo-1455885666463-9a69ce2f2f9b?w=1000&h=1000&fit=crop', sourceUrl: 'https://example.com/library/devotions', addedBy: 'kepler', tags: ['poetry', 'books', 'typography'] },
    { sourceType: 'instagram_post', title: 'Marine textures', sourceAuthor: '@j.d.frei', imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&h=1000&fit=crop', sourceUrl: 'https://instagram.com/p/example1', addedBy: 'namphuongnguyen', tags: ['marine', 'organic', 'textures'] },
    { sourceType: 'pinterest_pin', title: 'Pastel foliage', sourceAuthor: 'rocket', imageUrl: 'https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=1000&h=1000&fit=crop', sourceUrl: 'https://pinterest.com/pin/example2', addedBy: 'olivebranch', tags: ['plants', 'aesthetic', 'color'] },
    { sourceType: 'instagram_carousel', title: 'Japanese inventions', sourceAuthor: '@sabukaru.online', imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&h=1000&fit=crop', sourceUrl: 'https://instagram.com/p/example3', addedBy: 'cynthia01', tags: ['objects', 'innovation', 'culture'] },
    { sourceType: 'x_element', title: 'Heydar Aliyev Center', sourceAuthor: 'Minnie', imageUrl: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=1000&h=1000&fit=crop', sourceUrl: 'https://x.com/example4', addedBy: 'malhar', tags: ['architecture', 'zaha-hadid', 'curves'] },
    { sourceType: 'image', title: 'Editorial portrait', sourceAuthor: 'fredtougas', imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1000&h=1000&fit=crop', sourceUrl: 'https://example.com/editorial-portrait', addedBy: 'fredtougas', tags: ['portrait', 'fashion', 'face'] },
    { sourceType: 'image', title: 'Bloom ritual', sourceAuthor: 'luca', imageUrl: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?w=1000&h=1000&fit=crop', sourceUrl: 'https://example.com/bloom-ritual', addedBy: 'luca', tags: ['flower', 'spring', 'color'] },
    { sourceType: 'instagram_post', title: 'Paper studies', sourceAuthor: '@dailycine', imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1000&h=1000&fit=crop', sourceUrl: 'https://instagram.com/p/example5', addedBy: 'mspearly', tags: ['graphic-design', 'paper', 'layout'] },
    { sourceType: 'pinterest_pin', title: 'Neutral spaces', sourceAuthor: 'interior.lab', imageUrl: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1000&h=1000&fit=crop', sourceUrl: 'https://pinterest.com/pin/example6', addedBy: 'tania', tags: ['interior', 'minimal', 'furniture'] },
    { sourceType: 'x_element', title: 'Branding board', sourceAuthor: 'brandmemo', imageUrl: 'https://images.unsplash.com/photo-1452802447250-470a88ac82bc?w=1000&h=1000&fit=crop', sourceUrl: 'https://x.com/example7', addedBy: 'ema', tags: ['branding', 'logos', 'identity'] },
  ],
};

// Create more feed depth while preserving the same type shape.
const generateElements = (baseElements, total = 72) => {
  const sourceTypeTopic = {
    image: ['Art', 'Nature', 'Portraiture', 'Home Decor'],
    instagram_post: ['Fashion', 'Typography', 'Cinema', 'Branding'],
    instagram_carousel: ['UI/UX', 'Graphic Design', 'Architecture'],
    pinterest_pin: ['Interior Design', 'Home Decor', 'Quotes'],
    x_element: ['Technology', 'Motion', 'Art'],
  };

  const generated = [];
  for (let i = 0; i < total; i += 1) {
    const template = baseElements[i % baseElements.length];
    const topic = pick(sourceTypeTopic[template.sourceType] || featuredTopics);
    const stamp = i + 1;
    generated.push({
      sourceType: template.sourceType,
      title: `${template.title} ${stamp}`,
      sourceAuthor: template.sourceAuthor,
      imageUrl: `${template.imageUrl}&sig=${stamp}`,
      sourceUrl: `${template.sourceUrl}?ref=seed-${stamp}`,
      addedBy: template.addedBy,
      topic,
      tags: [...template.tags, slugify(topic, { lower: true, strict: true })],
      isFeatured: i < 12,
    });
  }
  return generated;
};

const ensureCategory = async (topic, order) => {
  const slug = slugify(topic, { lower: true, strict: true });
  const existing = await Category.findOne({ $or: [{ slug }, { name: topic }] });
  if (existing) return existing;
  return Category.create({
    name: topic,
    slug,
    icon: '✨',
    description: `${topic} inspirations`,
    color: '#111111',
    order,
    isActive: true,
  });
};

const ensureUser = async (username, displayName) => {
  const existing = await User.findOne({ username: username.toLowerCase() });
  if (existing) return existing;
  return User.create({
    username: username.toLowerCase(),
    email: `${username.toLowerCase()}@seed.picup.local`,
    password: 'seeduser123',
    displayName,
    isVerified: true,
    bio: 'Cosmos-home-like seed profile for testing.',
    avatar: `https://i.pravatar.cc/300?u=${encodeURIComponent(username.toLowerCase())}`,
  });
};

const ensureBoard = async ({ name, ownerId, coverImage, description }) => {
  const existing = await Board.findOne({ user: ownerId, name });
  if (existing) return existing;
  return Board.create({
    name,
    description,
    coverImage,
    user: ownerId,
    isPrivate: false,
    posts: [],
    postsCount: 0,
  });
};

const parseArgs = (argv) => {
  const args = { reset: false };
  argv.forEach((arg) => {
    if (arg === '--reset') args.reset = true;
  });
  return args;
};

async function seedCosmosHomeLike({ reset = false } = {}) {
  const elements = generateElements(cosmosHomeData.elements, 72);

  await connectDB();

  if (reset) {
    await Post.deleteMany({ tags: 'cosmos-home-like' });
    await Board.deleteMany({ description: /Cosmos home style cluster/i });
    await Like.deleteMany({});
    await Save.deleteMany({});
    await Follow.deleteMany({});
  }

  const allUsersMap = new Map();
  const clusterOwners = cosmosHomeData.selectedByCosmos.map((item) => item.owner);
  const elementAdders = [...new Set(elements.map((item) => item.addedBy))].map((username) => ({
    username,
    displayName: username
      .split(/[_-]/g)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
  }));

  for (const person of [...clusterOwners, ...elementAdders]) {
    if (allUsersMap.has(person.username.toLowerCase())) continue;
    const user = await ensureUser(person.username, person.displayName);
    allUsersMap.set(user.username, user);
  }

  const categoryMap = new Map();
  for (const [index, topic] of featuredTopics.entries()) {
    const category = await ensureCategory(topic, index + 1);
    categoryMap.set(topic, category);
  }

  const boardMap = new Map();
  for (const cluster of cosmosHomeData.selectedByCosmos) {
    const owner = allUsersMap.get(cluster.owner.username.toLowerCase());
    const board = await ensureBoard({
      name: cluster.title,
      ownerId: owner._id,
      coverImage: cluster.coverUrl,
      description: `Cosmos home style cluster for ${cluster.topic}`,
    });
    boardMap.set(slugify(cluster.title, { lower: true, strict: true }), board);
  }

  const boardsArray = [...boardMap.values()];
  const createdPosts = [];
  const boardPostIds = new Map();

  for (const board of boardsArray) {
    boardPostIds.set(String(board._id), []);
  }

  for (const element of elements) {
    const author = allUsersMap.get(element.addedBy.toLowerCase()) || pick([...allUsersMap.values()]);
    const topic = element.topic || pick(featuredTopics);
    const category = categoryMap.get(topic) || pick([...categoryMap.values()]);
    const targetBoard = pick(boardsArray);

    const post = await Post.create({
      title: element.title,
      description: `${element.sourceType} by ${element.sourceAuthor}.\nSource: ${element.sourceUrl}`,
      mediaType: 'image',
      image: {
        url: element.imageUrl,
        thumbnailUrl: element.imageUrl,
        width: 1000,
        height: 1000,
      },
      thumbnails: {
        small: `${element.imageUrl}&w=240`,
        medium: `${element.imageUrl}&w=480`,
        large: `${element.imageUrl}&w=960`,
      },
      productUrl: element.sourceUrl,
      tags: [
        ...new Set([
          ...element.tags,
          `source-${element.sourceType}`,
          'cosmos-home-like',
          'cluster-element',
        ]),
      ],
      category: category._id,
      author: author._id,
      status: 'published',
      likesCount: randInt(4, 180),
      savesCount: randInt(2, 90),
      commentsCount: randInt(0, 20),
      viewsCount: randInt(120, 6000),
      sharesCount: randInt(0, 16),
      isFeatured: !!element.isFeatured,
    });

    createdPosts.push(post);
    boardPostIds.get(String(targetBoard._id)).push(post._id);
  }

  for (const board of boardsArray) {
    const postsForBoard = boardPostIds.get(String(board._id)) || [];
    await Board.findByIdAndUpdate(board._id, {
      posts: postsForBoard,
      postsCount: postsForBoard.length,
    });
  }

  const usersArray = [...allUsersMap.values()];
  const likeDocs = [];
  const saveDocs = [];
  const followDocs = [];

  for (const post of createdPosts) {
    const likers = sample(usersArray, randInt(1, Math.min(10, usersArray.length)));
    const savers = sample(usersArray, randInt(1, Math.min(6, usersArray.length)));

    for (const liker of likers) {
      likeDocs.push({ user: liker._id, post: post._id });
    }
    for (const saver of savers) {
      saveDocs.push({ user: saver._id, post: post._id, board: pick(boardsArray)._id });
    }
  }

  for (const user of usersArray) {
    const others = usersArray.filter((candidate) => String(candidate._id) !== String(user._id));
    const following = sample(others, randInt(1, Math.min(5, others.length)));
    for (const target of following) {
      followDocs.push({ follower: user._id, following: target._id });
    }
  }

  await Like.insertMany(likeDocs, { ordered: false }).catch(() => {});
  await Save.insertMany(saveDocs, { ordered: false }).catch(() => {});
  await Follow.insertMany(followDocs, { ordered: false }).catch(() => {});

  for (const user of usersArray) {
    const [followersCount, followingCount, postsCount] = await Promise.all([
      Follow.countDocuments({ following: user._id }),
      Follow.countDocuments({ follower: user._id }),
      Post.countDocuments({ author: user._id, status: 'published' }),
    ]);

    await User.findByIdAndUpdate(user._id, {
      followersCount,
      followingCount,
      postsCount,
    });
  }

  for (const category of categoryMap.values()) {
    const postsCount = await Post.countDocuments({ category: category._id, status: 'published' });
    await Category.findByIdAndUpdate(category._id, { postsCount });
  }

  console.log('\n✅ Cosmos-home-like seed complete');
  console.log(`Users: ${usersArray.length}`);
  console.log(`Categories: ${categoryMap.size}`);
  console.log(`Boards (clusters): ${boardsArray.length}`);
  console.log(`Posts (elements): ${createdPosts.length}`);
  console.log(`Likes: ${await Like.countDocuments()}`);
  console.log(`Saves: ${await Save.countDocuments()}`);
  console.log(`Follows: ${await Follow.countDocuments()}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }

  try {
    await seedCosmosHomeLike({ reset: args.reset });
  } catch (error) {
    console.error(`Seed error: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
}

main();

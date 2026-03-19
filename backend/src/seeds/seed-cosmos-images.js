#!/usr/bin/env node

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const sharp = require('sharp');
const slugify = require('slugify');

const connectDB = require('../config/db');
const { initGridFS, uploadImageToGridFS, uploadThumbnailToGridFS } = require('../config/gridfs');
const User = require('../models/User');
const Category = require('../models/Category');
const Post = require('../models/Post');

const MIME_BY_FORMAT = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  svg: 'image/svg+xml',
  heif: 'image/heif',
  heic: 'image/heic',
};

const usage = () => {
  console.log(`
Usage:
  node src/seeds/seed-cosmos-images.js --manifest <file> [options]

Options:
  --manifest <file>          Tab-separated manifest: sourceUrl<TAB>localPath
  --author-email <email>     Seed author email
  --author-name <name>       Seed author display name
  --author-username <name>   Seed author username
  --category <name>          Category name
  --title-prefix <text>      Prefix used when generating post titles
  --tags <csv>               Comma-separated tag list
  --status <status>          Post status (published, draft, pending, ...)
  --help                     Show this help message
`);
};

const parseArgs = (argv) => {
  const args = {
    authorEmail: 'cosmos.seed@picup.local',
    authorName: 'Cosmos Seed Bot',
    authorUsername: 'cosmos_seed_bot',
    category: 'Photography',
    titlePrefix: 'Cosmos Import',
    tags: 'cosmos,imported,inspiration',
    status: 'published',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      args.help = true;
      continue;
    }

    const value = argv[index + 1];
    if (!value) {
      throw new Error(`Missing value for argument: ${arg}`);
    }

    switch (arg) {
      case '--manifest':
        args.manifest = value;
        break;
      case '--author-email':
        args.authorEmail = value;
        break;
      case '--author-name':
        args.authorName = value;
        break;
      case '--author-username':
        args.authorUsername = value;
        break;
      case '--category':
        args.category = value;
        break;
      case '--title-prefix':
        args.titlePrefix = value;
        break;
      case '--tags':
        args.tags = value;
        break;
      case '--status':
        args.status = value;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }

    index += 1;
  }

  return args;
};

const toUsername = (value) => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30);

  return normalized || 'cosmos_seed_bot';
};

const ensureUniqueUsername = async (baseUsername) => {
  const base = toUsername(baseUsername);
  let candidate = base;
  let suffix = 1;

  while (await User.exists({ username: candidate })) {
    const trimmedBase = base.slice(0, Math.max(1, 29 - String(suffix).length));
    candidate = `${trimmedBase}_${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const normalizeTags = (value) => {
  const tags = value
    .split(',')
    .map((tag) => slugify(tag, { lower: true, strict: true }))
    .filter(Boolean);

  return [...new Set(tags.length ? tags : ['cosmos', 'imported'])];
};

const parseManifest = (manifestPath) => {
  const contents = fs.readFileSync(manifestPath, 'utf8');

  return contents
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, lineIndex) => {
      const parts = line.split('\t');
      if (parts.length < 2) {
        throw new Error(`Invalid manifest row at line ${lineIndex + 1}`);
      }

      return {
        sourceUrl: parts[0],
        filePath: parts[1],
      };
    });
};

const ensureAuthor = async ({ email, name, username }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    return existing;
  }

  const uniqueUsername = await ensureUniqueUsername(username || name || email.split('@')[0]);

  return User.create({
    username: uniqueUsername,
    email,
    password: 'seedbot123',
    displayName: name,
    bio: 'Seed user for approved external image imports.',
    isVerified: true,
  });
};

const ensureCategory = async (categoryName) => {
  const slug = slugify(categoryName, { lower: true, strict: true });
  const existing = await Category.findOne({
    $or: [{ name: categoryName }, { slug }],
  });

  if (existing) {
    return existing;
  }

  const order = (await Category.countDocuments()) + 1;

  return Category.create({
    name: categoryName,
    slug,
    description: `Seeded category for ${categoryName}`,
    order,
  });
};

const inferMimetype = async (buffer, filePath) => {
  const metadata = await sharp(buffer).metadata();
  const explicitExt = path.extname(filePath).slice(1).toLowerCase();
  const format = (metadata.format || explicitExt || 'jpeg').toLowerCase();

  return {
    format,
    mimetype: MIME_BY_FORMAT[format] || 'application/octet-stream',
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
};

const buildTitle = (titlePrefix, index) =>
  `${titlePrefix} ${String(index + 1).padStart(2, '0')}`;

const buildDescription = (sourceUrl) =>
  `Imported from an approved Cosmos CDN asset.\nOriginal URL: ${sourceUrl}`;

const seedFromManifest = async (args) => {
  const manifestRows = parseManifest(args.manifest);
  if (!manifestRows.length) {
    throw new Error('Manifest is empty.');
  }

  await connectDB();
  initGridFS();

  const author = await ensureAuthor({
    email: args.authorEmail,
    name: args.authorName,
    username: args.authorUsername,
  });
  const category = await ensureCategory(args.category);
  const tags = normalizeTags(args.tags);

  const createdPosts = [];
  const failures = [];

  for (const [index, row] of manifestRows.entries()) {
    try {
      if (!fs.existsSync(row.filePath)) {
        throw new Error(`Downloaded file not found: ${row.filePath}`);
      }

      const buffer = fs.readFileSync(row.filePath);
      const { format, mimetype } = await inferMimetype(buffer, row.filePath);

      const basename = path.basename(row.filePath, path.extname(row.filePath)) || `cosmos-${index + 1}`;
      const originalName = path.extname(row.filePath)
        ? path.basename(row.filePath)
        : `${basename}.${format}`;

      const upload = await uploadImageToGridFS(buffer, originalName, mimetype);
      const thumbnail = await uploadThumbnailToGridFS(buffer, originalName);

      const post = await Post.create({
        title: buildTitle(args.titlePrefix, index),
        description: buildDescription(row.sourceUrl),
        mediaType: 'image',
        image: {
          url: upload.url,
          fileId: upload.fileId,
          thumbnailUrl: thumbnail.url,
          width: upload.width,
          height: upload.height,
        },
        thumbnails: {
          small: thumbnail.url,
          medium: thumbnail.url,
          large: upload.url,
        },
        tags,
        category: category._id,
        author: author._id,
        status: args.status,
      });

      createdPosts.push(post);
      console.log(`Seeded ${post.title}`);
    } catch (error) {
      failures.push({ row, error });
      console.error(`Failed to seed ${row.filePath}: ${error.message}`);
    }
  }

  if (createdPosts.length > 0) {
    await Promise.all([
      User.findByIdAndUpdate(author._id, { $inc: { postsCount: createdPosts.length } }),
      Category.findByIdAndUpdate(category._id, { $inc: { postsCount: createdPosts.length } }),
    ]);
  }

  console.log(`Created ${createdPosts.length} post(s).`);
  if (failures.length > 0) {
    console.log(`Skipped ${failures.length} file(s).`);
    process.exitCode = 1;
  }
};

const main = async () => {
  let args;

  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    usage();
    process.exit(1);
  }

  if (args.help) {
    usage();
    return;
  }

  if (!args.manifest) {
    console.error('--manifest is required.');
    usage();
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }

  try {
    await seedFromManifest(args);
  } catch (error) {
    console.error(`Seed error: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
};

main();

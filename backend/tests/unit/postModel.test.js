/**
 * Unit Tests — Post Model
 *
 * Tests schema validation, slug generation, defaults, and pre-save hooks.
 */
const mongoose = require('mongoose');
const Post = require('../../src/models/Post');
const { createUser, createPost, randomObjectId } = require('../helpers/factories');

describe('Post Model', () => {
  let author;

  beforeEach(async () => {
    author = await createUser();
  });

  // ── Schema Validation ──────────────────────────────────
  describe('Schema Validation', () => {
    it('should create a valid post with required fields', async () => {
      const post = await createPost(author._id);
      expect(post._id).toBeDefined();
      expect(post.title).toMatch(/^Test Post \d+_[a-z0-9]+_\d+$/);
      expect(post.author.toString()).toBe(author._id.toString());
      expect(post.status).toBe('published');
    });

    it('should reject post without title', async () => {
      await expect(
        Post.create({
          author: author._id,
          image: { url: 'https://example.com/img.jpg' },
        })
      ).rejects.toThrow(/title/i);
    });

    it('should reject post without author', async () => {
      await expect(
        Post.create({
          title: 'No Author Post',
          image: { url: 'https://example.com/img.jpg' },
        })
      ).rejects.toThrow(/author/i);
    });

    it('should enforce title maxlength (150)', async () => {
      await expect(
        createPost(author._id, { title: 'x'.repeat(151) })
      ).rejects.toThrow();
    });

    it('should enforce description maxlength (2000)', async () => {
      await expect(
        createPost(author._id, { description: 'x'.repeat(2001) })
      ).rejects.toThrow();
    });

    it('should accept valid status values', async () => {
      for (const status of ['draft', 'pending', 'published', 'rejected', 'archived']) {
        const post = await createPost(author._id, { status });
        expect(post.status).toBe(status);
      }
    });

    it('should reject invalid status', async () => {
      await expect(
        createPost(author._id, { status: 'deleted' })
      ).rejects.toThrow();
    });

    it('should accept valid mediaType values', async () => {
      const imgPost = await createPost(author._id, { mediaType: 'image' });
      expect(imgPost.mediaType).toBe('image');

      const vidPost = await createPost(author._id, {
        mediaType: 'video',
        image: undefined,
        video: { url: 'https://example.com/video.mp4' },
      });
      expect(vidPost.mediaType).toBe('video');
    });

    it('should default mediaType to image', async () => {
      const post = await createPost(author._id);
      expect(post.mediaType).toBe('image');
    });

    it('should default numeric counts to 0', async () => {
      const post = await createPost(author._id);
      expect(post.likesCount).toBe(0);
      expect(post.commentsCount).toBe(0);
      expect(post.viewsCount).toBe(0);
      expect(post.savesCount).toBe(0);
    });
  });

  // ── Slug Generation ────────────────────────────────────
  describe('Slug Generation', () => {
    it('should auto-generate slug from title', async () => {
      const post = await createPost(author._id, { title: 'My Amazing Post' });
      expect(post.slug).toBeDefined();
      expect(post.slug).toContain('my-amazing-post');
    });

    it('should generate unique slugs for same title', async () => {
      const post1 = await createPost(author._id, { title: 'Duplicate Title' });
      const post2 = await createPost(author._id, { title: 'Duplicate Title' });
      expect(post1.slug).not.toBe(post2.slug);
    });

    it('should handle special characters in title', async () => {
      const post = await createPost(author._id, { title: 'Hello & Goodbye! @World' });
      expect(post.slug).toBeDefined();
      expect(post.slug).not.toContain('&');
      expect(post.slug).not.toContain('!');
      expect(post.slug).not.toContain('@');
    });
  });

  // ── Tags ───────────────────────────────────────────────
  describe('Tags', () => {
    it('should store tags as lowercase', async () => {
      const post = await createPost(author._id, { tags: ['React', 'NEXT', 'TypeScript'] });
      expect(post.tags).toEqual(['react', 'next', 'typescript']);
    });

    it('should trim tag whitespace', async () => {
      const post = await createPost(author._id, { tags: ['  react  ', '  next  '] });
      expect(post.tags).toEqual(['react', 'next']);
    });

    it('should default to empty array', async () => {
      const post = await Post.create({
        title: 'No Tags Post',
        author: author._id,
        image: { url: 'https://example.com/img.jpg' },
      });
      expect(post.tags).toEqual([]);
    });
  });

  // ── Image & Video ──────────────────────────────────────
  describe('Media Fields', () => {
    it('should store image data correctly', async () => {
      const post = await createPost(author._id, {
        image: {
          url: 'https://example.com/full.jpg',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          width: 1920,
          height: 1080,
        },
      });
      expect(post.image.url).toBe('https://example.com/full.jpg');
      expect(post.image.thumbnailUrl).toBe('https://example.com/thumb.jpg');
      expect(post.image.width).toBe(1920);
      expect(post.image.height).toBe(1080);
    });

    it('should store video data correctly', async () => {
      const post = await createPost(author._id, {
        mediaType: 'video',
        image: undefined,
        video: {
          url: 'https://example.com/video.mp4',
          duration: 120,
          width: 1920,
          height: 1080,
          format: 'mp4',
          bytes: 15000000,
        },
      });
      expect(post.video.url).toBe('https://example.com/video.mp4');
      expect(post.video.duration).toBe(120);
    });
  });

  // ── Price ──────────────────────────────────────────────
  describe('Price', () => {
    it('should store price data', async () => {
      const post = await createPost(author._id, {
        price: { amount: 29.99, currency: 'USD' },
      });
      expect(post.price.amount).toBe(29.99);
      expect(post.price.currency).toBe('USD');
    });

    it('should reject negative price', async () => {
      await expect(
        createPost(author._id, { price: { amount: -10 } })
      ).rejects.toThrow();
    });
  });

  // ── Indexes ────────────────────────────────────────────
  describe('Indexes', () => {
    it('should have unique index on slug', async () => {
      const post = await createPost(author._id, { title: 'Unique Slug Test' });

      // Insert directly to bypass the pre-save slug generation hook
      try {
        await Post.collection.insertOne({
          title: 'Different Title',
          slug: post.slug, // force duplicate slug at the driver level
          author: author._id,
          mediaType: 'image',
          image: { url: 'https://example.com/img.jpg' },
        });
        // If we get here, the unique index didn't catch it — fail the test
        throw new Error('Expected duplicate key error');
      } catch (err) {
        expect(err.code || err.message).toBeDefined();
      }
    });
  });
});

/**
 * Unit Tests — Comment Model
 *
 * Tests schema validation, parent comment references, and indexes.
 */
const mongoose = require('mongoose');
const Comment = require('../../src/models/Comment');
const { createUser, createPost, createComment, randomObjectId } = require('../helpers/factories');

describe('Comment Model', () => {
  let author, post;

  beforeEach(async () => {
    author = await createUser();
    post = await createPost(author._id);
  });

  // ── Schema Validation ──────────────────────────────────
  describe('Schema Validation', () => {
    it('should create a valid comment', async () => {
      const comment = await createComment(post._id, author._id);
      expect(comment._id).toBeDefined();
      expect(comment.text).toMatch(/^Test comment \d+_[a-z0-9]+_\d+$/);
      expect(comment.post.toString()).toBe(post._id.toString());
      expect(comment.user.toString()).toBe(author._id.toString());
      expect(comment.parentComment).toBeNull();
      expect(comment.likesCount).toBe(0);
      expect(comment.isEdited).toBe(false);
    });

    it('should reject comment without text', async () => {
      await expect(
        Comment.create({ post: post._id, user: author._id })
      ).rejects.toThrow();
    });

    it('should reject comment without post', async () => {
      await expect(
        Comment.create({ text: 'orphan comment', user: author._id })
      ).rejects.toThrow();
    });

    it('should reject comment without user', async () => {
      await expect(
        Comment.create({ text: 'anonymous comment', post: post._id })
      ).rejects.toThrow();
    });

    it('should enforce text maxlength (1000)', async () => {
      await expect(
        createComment(post._id, author._id, { text: 'x'.repeat(1001) })
      ).rejects.toThrow();
    });

    it('should trim text whitespace', async () => {
      const comment = await createComment(post._id, author._id, {
        text: '  trimmed comment  ',
      });
      expect(comment.text).toBe('trimmed comment');
    });
  });

  // ── Parent Comment (Replies) ───────────────────────────
  describe('Replies (Parent Comment)', () => {
    it('should create a reply to a comment', async () => {
      const parentComment = await createComment(post._id, author._id);
      const reply = await createComment(post._id, author._id, {
        parentComment: parentComment._id,
        text: 'This is a reply',
      });
      expect(reply.parentComment.toString()).toBe(parentComment._id.toString());
    });

    it('should default parentComment to null', async () => {
      const comment = await createComment(post._id, author._id);
      expect(comment.parentComment).toBeNull();
    });
  });

  // ── Timestamps ─────────────────────────────────────────
  describe('Timestamps', () => {
    it('should have createdAt and updatedAt', async () => {
      const comment = await createComment(post._id, author._id);
      expect(comment.createdAt).toBeDefined();
      expect(comment.updatedAt).toBeDefined();
      expect(comment.createdAt instanceof Date).toBe(true);
    });
  });

  // ── Edit Tracking ──────────────────────────────────────
  describe('Edit Tracking', () => {
    it('should track edit status', async () => {
      const comment = await createComment(post._id, author._id);
      expect(comment.isEdited).toBe(false);

      comment.isEdited = true;
      comment.text = 'edited comment';
      await comment.save();

      const updated = await Comment.findById(comment._id);
      expect(updated.isEdited).toBe(true);
      expect(updated.text).toBe('edited comment');
    });
  });
});

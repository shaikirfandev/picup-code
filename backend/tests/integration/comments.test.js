/**
 * Integration Tests — Comment API Routes
 *
 * End-to-end tests for listing, creating, editing, and deleting comments.
 */
const request = require('supertest');
const createTestApp = require('../helpers/testApp');
const {
  createAuthenticatedUser, createUser, createPost, createComment, randomObjectId,
} = require('../helpers/factories');
const Comment = require('../../src/models/Comment');
const Post = require('../../src/models/Post');

const app = createTestApp();

describe('Comment API — /api/comments', () => {
  // ── Get Comments ───────────────────────────────────────
  describe('GET /api/comments/post/:postId', () => {
    it('should return comments for a post', async () => {
      const author = await createUser();
      const post = await createPost(author._id);
      await createComment(post._id, author._id, { text: 'First comment' });
      await createComment(post._id, author._id, { text: 'Second comment' });

      const res = await request(app).get(`/api/comments/post/${post._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(2);
    });

    it('should return empty array for post with no comments', async () => {
      const author = await createUser();
      const post = await createPost(author._id);

      const res = await request(app).get(`/api/comments/post/${post._id}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should only return top-level comments (not replies)', async () => {
      const author = await createUser();
      const post = await createPost(author._id);
      const parent = await createComment(post._id, author._id);
      await createComment(post._id, author._id, { parentComment: parent._id });

      const res = await request(app).get(`/api/comments/post/${post._id}`);

      expect(res.body.data.length).toBe(1); // Only top-level
    });
  });

  // ── Get Replies ────────────────────────────────────────
  describe('GET /api/comments/:commentId/replies', () => {
    it('should return replies to a comment', async () => {
      const author = await createUser();
      const post = await createPost(author._id);
      const parent = await createComment(post._id, author._id, { text: 'Parent' });
      await createComment(post._id, author._id, {
        parentComment: parent._id,
        text: 'Reply 1',
      });
      await createComment(post._id, author._id, {
        parentComment: parent._id,
        text: 'Reply 2',
      });

      const res = await request(app).get(`/api/comments/${parent._id}/replies`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('should return empty array when no replies exist', async () => {
      const author = await createUser();
      const post = await createPost(author._id);
      const comment = await createComment(post._id, author._id);

      const res = await request(app).get(`/api/comments/${comment._id}/replies`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  // ── Create Comment ─────────────────────────────────────
  describe('POST /api/comments/post/:postId', () => {
    it('should create a new comment', async () => {
      const { user, token } = await createAuthenticatedUser();
      const author = await createUser();
      const post = await createPost(author._id);

      const res = await request(app)
        .post(`/api/comments/post/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'Great post!' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.text).toBe('Great post!');
      expect(res.body.data.user).toBeDefined();

      // Verify commentsCount incremented on post
      const updated = await Post.findById(post._id);
      expect(updated.commentsCount).toBe(1);
    });

    it('should create a reply to a comment', async () => {
      const { user, token } = await createAuthenticatedUser();
      const author = await createUser();
      const post = await createPost(author._id);
      const parent = await createComment(post._id, author._id);

      const res = await request(app)
        .post(`/api/comments/post/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'Nice reply!', parentComment: parent._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.data.parentComment).toBe(parent._id.toString());
    });

    it('should reject comment without text', async () => {
      const { token } = await createAuthenticatedUser();
      const author = await createUser();
      const post = await createPost(author._id);

      const res = await request(app)
        .post(`/api/comments/post/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should reject comment exceeding max length', async () => {
      const { token } = await createAuthenticatedUser();
      const author = await createUser();
      const post = await createPost(author._id);

      const res = await request(app)
        .post(`/api/comments/post/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'x'.repeat(1001) });

      expect(res.status).toBe(400);
    });

    it('should reject comment without authentication', async () => {
      const author = await createUser();
      const post = await createPost(author._id);

      const res = await request(app)
        .post(`/api/comments/post/${post._id}`)
        .send({ text: 'Anonymous comment' });

      expect(res.status).toBe(401);
    });

    it('should reject comment on non-existent post', async () => {
      const { token } = await createAuthenticatedUser();
      const fakeId = randomObjectId();

      const res = await request(app)
        .post(`/api/comments/post/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'Orphan comment' });

      expect([400, 404]).toContain(res.status);
    });
  });

  // ── Edit Comment ───────────────────────────────────────
  describe('PUT /api/comments/:id', () => {
    it('should edit own comment', async () => {
      const { user, token } = await createAuthenticatedUser();
      const post = await createPost(user._id);
      const comment = await createComment(post._id, user._id, { text: 'Original' });

      const res = await request(app)
        .put(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'Edited comment' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await Comment.findById(comment._id);
      expect(updated.text).toBe('Edited comment');
      expect(updated.isEdited).toBe(true);
    });

    it('should reject editing another user\'s comment', async () => {
      const { token: attackerToken } = await createAuthenticatedUser();
      const victim = await createUser();
      const post = await createPost(victim._id);
      const comment = await createComment(post._id, victim._id);

      const res = await request(app)
        .put(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${attackerToken}`)
        .send({ text: 'Hijacked!' });

      expect(res.status).toBe(403);
    });
  });

  // ── Delete Comment ─────────────────────────────────────
  describe('DELETE /api/comments/:id', () => {
    it('should delete own comment', async () => {
      const { user, token } = await createAuthenticatedUser();
      const post = await createPost(user._id);
      const comment = await createComment(post._id, user._id);
      // Manually set commentsCount since createComment doesn't increment it
      await Post.findByIdAndUpdate(post._id, { commentsCount: 1 });

      const res = await request(app)
        .delete(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deleted = await Comment.findById(comment._id);
      expect(deleted).toBeNull();
    });

    it('should reject deleting another user\'s comment (non-admin)', async () => {
      const { token } = await createAuthenticatedUser();
      const victim = await createUser();
      const post = await createPost(victim._id);
      const comment = await createComment(post._id, victim._id);

      const res = await request(app)
        .delete(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin to delete any comment', async () => {
      const { token: adminToken } = await createAuthenticatedUser({ role: 'admin' });
      const author = await createUser();
      const post = await createPost(author._id);
      const comment = await createComment(post._id, author._id);

      const res = await request(app)
        .delete(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });
});

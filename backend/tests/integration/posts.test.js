/**
 * Integration Tests — Post API Routes
 *
 * End-to-end tests for feed, getById, like, save, share, report, update, delete.
 * NOTE: createPost is tested separately since it requires file upload mocking.
 */
const request = require('supertest');
const createTestApp = require('../helpers/testApp');
const {
  createAuthenticatedUser, createUser, createPost, generateToken, randomObjectId,
} = require('../helpers/factories');
const Post = require('../../src/models/Post');
const User = require('../../src/models/User');

const app = createTestApp();

describe('Post API — /api/posts', () => {
  // ── Get Feed ───────────────────────────────────────────
  describe('GET /api/posts/feed', () => {
    it('should return paginated feed', async () => {
      const author = await createUser();
      await createPost(author._id, { title: 'Feed Post 1' });
      await createPost(author._id, { title: 'Feed Post 2' });

      const res = await request(app)
        .get('/api/posts/feed')
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(2);
    });

    it('should only return published posts', async () => {
      const author = await createUser();
      await createPost(author._id, { status: 'published' });
      await createPost(author._id, { status: 'draft' });
      await createPost(author._id, { status: 'archived' });

      const res = await request(app).get('/api/posts/feed');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it('should sort by recent (default)', async () => {
      const author = await createUser();
      const old = await createPost(author._id, { title: 'Old Post' });
      // Small delay for different timestamps
      await new Promise((r) => setTimeout(r, 50));
      const newer = await createPost(author._id, { title: 'New Post' });

      const res = await request(app).get('/api/posts/feed');

      expect(res.body.data[0].title).toBe('New Post');
      expect(res.body.data[1].title).toBe('Old Post');
    });

    it('should filter by tag', async () => {
      const author = await createUser();
      await createPost(author._id, { tags: ['react'] });
      await createPost(author._id, { tags: ['vue'] });

      const res = await request(app).get('/api/posts/feed').query({ tag: 'react' });

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].tags).toContain('react');
    });

    it('should handle empty feed', async () => {
      const res = await request(app).get('/api/posts/feed');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
    });

    it('should populate author info', async () => {
      const author = await createUser({ displayName: 'Cool Creator' });
      await createPost(author._id);

      const res = await request(app).get('/api/posts/feed');

      expect(res.body.data[0].author).toBeDefined();
      expect(res.body.data[0].author.username).toBe(author.username);
      expect(res.body.data[0].author.displayName).toBe('Cool Creator');
    });

    it('should respect pagination limit', async () => {
      const author = await createUser();
      for (let i = 0; i < 5; i++) {
        await createPost(author._id, { title: `Post ${i}` });
      }

      const res = await request(app).get('/api/posts/feed').query({ limit: 2 });

      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.totalPages).toBe(3);
      expect(res.body.pagination.hasMore).toBe(true);
    });
  });

  // ── Get Post by ID ─────────────────────────────────────
  describe('GET /api/posts/:id', () => {
    it('should return a single post', async () => {
      const author = await createUser();
      const post = await createPost(author._id, { title: 'Single Post' });

      const res = await request(app).get(`/api/posts/${post._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Single Post');
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = randomObjectId();
      const res = await request(app).get(`/api/posts/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should populate author on single post', async () => {
      const author = await createUser({ username: 'postauthor' });
      const post = await createPost(author._id);

      const res = await request(app).get(`/api/posts/${post._id}`);

      expect(res.body.data.author.username).toBe('postauthor');
    });
  });

  // ── Like Post ──────────────────────────────────────────
  describe('POST /api/posts/:id/like', () => {
    it('should like a post', async () => {
      const { user, token } = await createAuthenticatedUser();
      const author = await createUser();
      const post = await createPost(author._id);

      const res = await request(app)
        .post(`/api/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify likesCount incremented
      const updated = await Post.findById(post._id);
      expect(updated.likesCount).toBe(1);
    });

    it('should unlike a previously liked post (toggle)', async () => {
      const { user, token } = await createAuthenticatedUser();
      const author = await createUser();
      const post = await createPost(author._id);

      // Like
      await request(app)
        .post(`/api/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${token}`);

      // Unlike (toggle)
      const res = await request(app)
        .post(`/api/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const updated = await Post.findById(post._id);
      expect(updated.likesCount).toBe(0);
    });

    it('should reject like without authentication', async () => {
      const author = await createUser();
      const post = await createPost(author._id);

      const res = await request(app).post(`/api/posts/${post._id}/like`);

      expect(res.status).toBe(401);
    });
  });

  // ── Save Post ──────────────────────────────────────────
  describe('POST /api/posts/:id/save', () => {
    it('should save a post', async () => {
      const { user, token } = await createAuthenticatedUser();
      const author = await createUser();
      const post = await createPost(author._id);

      const res = await request(app)
        .post(`/api/posts/${post._id}/save`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await Post.findById(post._id);
      expect(updated.savesCount).toBe(1);
    });

    it('should unsave a previously saved post (toggle)', async () => {
      const { user, token } = await createAuthenticatedUser();
      const author = await createUser();
      const post = await createPost(author._id);

      await request(app)
        .post(`/api/posts/${post._id}/save`)
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .post(`/api/posts/${post._id}/save`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const updated = await Post.findById(post._id);
      expect(updated.savesCount).toBe(0);
    });

    it('should reject save without authentication', async () => {
      const author = await createUser();
      const post = await createPost(author._id);

      const res = await request(app).post(`/api/posts/${post._id}/save`);

      expect(res.status).toBe(401);
    });
  });

  // ── Update Post ────────────────────────────────────────
  describe('PUT /api/posts/:id', () => {
    it('should update own post', async () => {
      const { user, token } = await createAuthenticatedUser();
      const post = await createPost(user._id, { title: 'Original Title' });

      const res = await request(app)
        .put(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title', description: 'New description' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await Post.findById(post._id);
      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('New description');
    });

    it('should reject updating another user\'s post', async () => {
      const { token: token1 } = await createAuthenticatedUser();
      const otherUser = await createUser();
      const post = await createPost(otherUser._id);

      const res = await request(app)
        .put(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'Hijacked Title' });

      expect(res.status).toBe(403);
    });

    it('should reject update without authentication', async () => {
      const author = await createUser();
      const post = await createPost(author._id);

      const res = await request(app)
        .put(`/api/posts/${post._id}`)
        .send({ title: 'Anonymous Update' });

      expect(res.status).toBe(401);
    });
  });

  // ── Delete Post ────────────────────────────────────────
  describe('DELETE /api/posts/:id', () => {
    it('should delete own post', async () => {
      const { user, token } = await createAuthenticatedUser();
      const post = await createPost(user._id);

      const res = await request(app)
        .delete(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject deleting another user\'s post', async () => {
      const { token } = await createAuthenticatedUser();
      const otherUser = await createUser();
      const post = await createPost(otherUser._id);

      const res = await request(app)
        .delete(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect([403, 401]).toContain(res.status);
    });

    it('should allow admin to delete any post', async () => {
      const { token: adminToken } = await createAuthenticatedUser({ role: 'admin' });
      const author = await createUser();
      const post = await createPost(author._id);

      const res = await request(app)
        .delete(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  // ── Saved Posts ────────────────────────────────────────
  describe('GET /api/posts/saved', () => {
    it('should return empty saved posts initially', async () => {
      const { token } = await createAuthenticatedUser();

      const res = await request(app)
        .get('/api/posts/saved')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should reject without authentication', async () => {
      const res = await request(app).get('/api/posts/saved');

      expect(res.status).toBe(401);
    });
  });

  // ── Share (increment count) ────────────────────────────
  describe('POST /api/posts/:id/share', () => {
    it('should increment share count', async () => {
      const author = await createUser();
      const post = await createPost(author._id);

      const res = await request(app).post(`/api/posts/${post._id}/share`);

      expect(res.status).toBe(200);

      const updated = await Post.findById(post._id);
      expect(updated.sharesCount).toBe(1);
    });
  });

  // ── Report Post ────────────────────────────────────────
  describe('POST /api/posts/:id/report', () => {
    it('should report a post', async () => {
      const { user, token } = await createAuthenticatedUser();
      const author = await createUser();
      const post = await createPost(author._id);

      const res = await request(app)
        .post(`/api/posts/${post._id}/report`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'spam', description: 'This is spam content' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject report without reason', async () => {
      const { token } = await createAuthenticatedUser();
      const author = await createUser();
      const post = await createPost(author._id);

      const res = await request(app)
        .post(`/api/posts/${post._id}/report`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should reject report with invalid reason', async () => {
      const { token } = await createAuthenticatedUser();
      const author = await createUser();
      const post = await createPost(author._id);

      const res = await request(app)
        .post(`/api/posts/${post._id}/report`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'not-a-valid-reason' });

      expect(res.status).toBe(400);
    });
  });
});

/**
 * Integration Tests — User API Routes
 *
 * Tests for profiles, follow system, and suggested users.
 */
const request = require('supertest');
const createTestApp = require('../helpers/testApp');
const {
  createAuthenticatedUser, createUser, createPost, randomObjectId,
} = require('../helpers/factories');
const { Follow } = require('../../src/models/Interaction');
const User = require('../../src/models/User');

const app = createTestApp();

describe('User API — /api/users', () => {
  // ── Get Profile ────────────────────────────────────────
  describe('GET /api/users/profile/:username', () => {
    it('should return a user profile', async () => {
      const user = await createUser({ username: 'profileuser' });

      const res = await request(app).get('/api/users/profile/profileuser');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('profileuser');
      // Password should not be returned
      expect(res.body.data.password).toBeUndefined();
    });

    it('should indicate isFollowing when authenticated & following', async () => {
      const { user: viewer, token } = await createAuthenticatedUser();
      const target = await createUser({ username: 'targetuser' });

      await Follow.create({ follower: viewer._id, following: target._id });

      const res = await request(app)
        .get('/api/users/profile/targetuser')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isFollowing).toBe(true);
    });

    it('should return isFollowing false when not following', async () => {
      const { token } = await createAuthenticatedUser();
      await createUser({ username: 'strangeruser' });

      const res = await request(app)
        .get('/api/users/profile/strangeruser')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.data.isFollowing).toBe(false);
    });

    it('should return 404 for non-existent username', async () => {
      const res = await request(app).get('/api/users/profile/doesnotexist');

      expect(res.status).toBe(404);
    });
  });

  // ── Get User Posts ─────────────────────────────────────
  describe('GET /api/users/profile/:username/posts', () => {
    it('should return published posts by user', async () => {
      const user = await createUser({ username: 'postsuser' });
      await createPost(user._id, { status: 'published' });
      await createPost(user._id, { status: 'published' });
      await createPost(user._id, { status: 'draft' }); // should be excluded

      const res = await request(app).get('/api/users/profile/postsuser/posts');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app).get('/api/users/profile/ghost/posts');

      expect(res.status).toBe(404);
    });
  });

  // ── Update Profile ─────────────────────────────────────
  describe('PUT /api/users/profile', () => {
    it('should update allowed fields', async () => {
      const { user, token } = await createAuthenticatedUser();

      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ displayName: 'New Display', bio: 'New bio', website: 'https://example.com' });

      expect(res.status).toBe(200);
      expect(res.body.data.displayName).toBe('New Display');
      expect(res.body.data.bio).toBe('New bio');
    });

    it('should reject unauthenticated update', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .send({ displayName: 'Hacked' });

      expect(res.status).toBe(401);
    });
  });

  // ── Follow ─────────────────────────────────────────────
  describe('POST /api/users/:id/follow', () => {
    it('should follow a user', async () => {
      const { user: follower, token } = await createAuthenticatedUser();
      const target = await createUser();

      const res = await request(app)
        .post(`/api/users/${target._id}/follow`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isFollowing).toBe(true);

      // Verify follow relationship
      const follow = await Follow.findOne({ follower: follower._id, following: target._id });
      expect(follow).not.toBeNull();

      // Verify counts incremented
      const updatedFollower = await User.findById(follower._id);
      expect(updatedFollower.followingCount).toBe(1);

      const updatedTarget = await User.findById(target._id);
      expect(updatedTarget.followersCount).toBe(1);
    });

    it('should reject following yourself', async () => {
      const { user, token } = await createAuthenticatedUser();

      const res = await request(app)
        .post(`/api/users/${user._id}/follow`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    it('should reject duplicate follow', async () => {
      const { user: follower, token } = await createAuthenticatedUser();
      const target = await createUser();

      // Follow once
      await request(app)
        .post(`/api/users/${target._id}/follow`)
        .set('Authorization', `Bearer ${token}`);

      // Follow again
      const res = await request(app)
        .post(`/api/users/${target._id}/follow`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent user', async () => {
      const { token } = await createAuthenticatedUser();
      const fakeId = randomObjectId();

      const res = await request(app)
        .post(`/api/users/${fakeId}/follow`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // ── Unfollow ───────────────────────────────────────────
  describe('DELETE /api/users/:id/follow', () => {
    it('should unfollow a user', async () => {
      const { user: follower, token } = await createAuthenticatedUser();
      const target = await createUser();

      // Follow first
      await Follow.create({ follower: follower._id, following: target._id });
      await User.findByIdAndUpdate(follower._id, { $inc: { followingCount: 1 } });
      await User.findByIdAndUpdate(target._id, { $inc: { followersCount: 1 } });

      const res = await request(app)
        .delete(`/api/users/${target._id}/follow`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isFollowing).toBe(false);
    });

    it('should reject unfollowing someone you don\'t follow', async () => {
      const { token } = await createAuthenticatedUser();
      const target = await createUser();

      const res = await request(app)
        .delete(`/api/users/${target._id}/follow`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });

  // ── Followers / Following Lists ────────────────────────
  describe('GET /api/users/profile/:username/followers', () => {
    it('should return paginated followers list', async () => {
      const target = await createUser({ username: 'popularuser' });
      const f1 = await createUser({ username: 'fan1' });
      const f2 = await createUser({ username: 'fan2' });

      await Follow.create({ follower: f1._id, following: target._id });
      await Follow.create({ follower: f2._id, following: target._id });

      const res = await request(app).get('/api/users/profile/popularuser/followers');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app).get('/api/users/profile/nobody/followers');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/users/profile/:username/following', () => {
    it('should return paginated following list', async () => {
      const user = await createUser({ username: 'socialuser' });
      const t1 = await createUser({ username: 'idol1' });
      const t2 = await createUser({ username: 'idol2' });

      await Follow.create({ follower: user._id, following: t1._id });
      await Follow.create({ follower: user._id, following: t2._id });

      const res = await request(app).get('/api/users/profile/socialuser/following');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });
  });

  // ── Suggested Users ────────────────────────────────────
  describe('GET /api/users/suggested', () => {
    it('should return users not already followed', async () => {
      const { user: me, token } = await createAuthenticatedUser();
      const followed = await createUser({ username: 'already_followed' });
      const notFollowed = await createUser({ username: 'stranger' });

      await Follow.create({ follower: me._id, following: followed._id });

      const res = await request(app)
        .get('/api/users/suggested')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const names = res.body.data.map((u) => u.username);
      expect(names).not.toContain('already_followed');
      expect(names).toContain('stranger');
    });

    it('should not include the requesting user', async () => {
      const { user, token } = await createAuthenticatedUser();

      const res = await request(app)
        .get('/api/users/suggested')
        .set('Authorization', `Bearer ${token}`);

      const ids = res.body.data.map((u) => u._id);
      expect(ids).not.toContain(user._id.toString());
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/users/suggested');
      expect(res.status).toBe(401);
    });
  });
});

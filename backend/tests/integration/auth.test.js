/**
 * Integration Tests — Auth API Routes
 *
 * End-to-end tests for register, login, me, token refresh, logout, and password change.
 */
const request = require('supertest');
const createTestApp = require('../helpers/testApp');
const { createUser, createAuthenticatedUser, generateRefreshToken } = require('../helpers/factories');
const User = require('../../src/models/User');

const app = createTestApp();

describe('Auth API — /api/auth', () => {
  // ── Registration ───────────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@test.com',
          password: 'password123',
          displayName: 'New User',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.username).toBe('newuser');
      expect(res.body.data.user.email).toBe('newuser@test.com');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      // Should not expose password
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should reject registration with existing email', async () => {
      await createUser({ email: 'taken@test.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'anotheruser',
          email: 'taken@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should reject registration with existing username', async () => {
      await createUser({ username: 'takenuser' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'takenuser',
          email: 'unique@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'shortpw',
          email: 'shortpw@test.com',
          password: '12345',
        });

      expect(res.status).toBe(400);
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'invalidemail',
          email: 'not-an-email',
          password: 'password123',
        });

      expect(res.status).toBe(400);
    });

    it('should reject registration with short username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab',
          email: 'short@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(400);
    });

    it('should reject registration without required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ── Login ──────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Register first via API to ensure password hashing works end-to-end
      await request(app).post('/api/auth/register').send({
        username: 'loginuser',
        email: 'login@test.com',
        password: 'password123',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      await request(app).post('/api/auth/register').send({
        username: 'wrongpw',
        email: 'wrongpw@test.com',
        password: 'correctpassword',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrongpw@test.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'noone@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login for banned user', async () => {
      // Register then ban
      await request(app).post('/api/auth/register').send({
        username: 'bannedlogin',
        email: 'banned@test.com',
        password: 'password123',
      });
      await User.findOneAndUpdate({ email: 'banned@test.com' }, { status: 'banned' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'banned@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/banned/i);
    });

    it('should reject login without email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('should reject login without password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com' });

      expect(res.status).toBe(400);
    });
  });

  // ── Get Current User ───────────────────────────────────
  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const { user, token } = await createAuthenticatedUser();

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(user._id.toString());
      expect(res.body.data.username).toBe(user.username);
    });

    it('should reject without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
    });
  });

  // ── Token Refresh ──────────────────────────────────────
  describe('POST /api/auth/refresh-token', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const { user } = await createAuthenticatedUser();
      const refreshToken = generateRefreshToken(user._id);

      // Store the refresh token on the user
      await User.findByIdAndUpdate(user._id, { refreshToken });

      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should reject without refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should reject with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid.token' });

      expect(res.status).toBe(401);
    });
  });

  // ── Logout ─────────────────────────────────────────────
  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const { token } = await createAuthenticatedUser();

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject logout without token', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(401);
    });
  });

  // ── Change Password ────────────────────────────────────
  describe('PUT /api/auth/change-password', () => {
    it('should change password with correct current password', async () => {
      // Register via API so password is properly hashed
      const regRes = await request(app).post('/api/auth/register').send({
        username: 'changepw',
        email: 'changepw@test.com',
        password: 'oldpassword',
      });
      const token = regRes.body.data.accessToken;

      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify new password works
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'changepw@test.com',
        password: 'newpassword',
      });
      expect(loginRes.status).toBe(200);
    });

    it('should reject with wrong current password', async () => {
      const regRes = await request(app).post('/api/auth/register').send({
        username: 'changepw2',
        email: 'changepw2@test.com',
        password: 'correctpw',
      });
      const token = regRes.body.data.accessToken;

      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrongpw',
          newPassword: 'newpassword',
        });

      expect(res.status).toBe(400);
    });
  });
});

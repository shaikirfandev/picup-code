/**
 * Unit Tests — User Model
 *
 * Tests schema validation, password hashing, instance methods, and virtuals.
 */
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const { createUser } = require('../helpers/factories');

describe('User Model', () => {
  // ── Schema Validation ──────────────────────────────────
  describe('Schema Validation', () => {
    it('should create a valid user with required fields', async () => {
      const user = await createUser();
      expect(user._id).toBeDefined();
      expect(user.username).toMatch(/^testuser\d+_[a-z0-9]+_\d+$/);
      expect(user.email).toMatch(/^testuser\d+_[a-z0-9]+_\d+@test\.com$/);
      expect(user.status).toBe('active');
      expect(user.role).toBe('user');
    });

    it('should reject user without username', async () => {
      await expect(
        User.create({ email: 'no-username@test.com', password: 'password123' })
      ).rejects.toThrow(/username/i);
    });

    it('should reject user without email', async () => {
      await expect(
        User.create({ username: 'noemailuser', password: 'password123' })
      ).rejects.toThrow(/email/i);
    });

    it('should enforce unique username', async () => {
      await createUser({ username: 'uniqueuser' });
      await expect(
        createUser({ username: 'uniqueuser', email: 'different@test.com' })
      ).rejects.toThrow();
    });

    it('should enforce unique email', async () => {
      await createUser({ email: 'unique@test.com' });
      await expect(
        createUser({ username: 'differentuser', email: 'unique@test.com' })
      ).rejects.toThrow();
    });

    it('should reject username shorter than 3 chars', async () => {
      await expect(
        User.create({ username: 'ab', email: 'short@test.com', password: 'password123' })
      ).rejects.toThrow();
    });

    it('should reject username longer than 30 chars', async () => {
      await expect(
        User.create({
          username: 'a'.repeat(31),
          email: 'long@test.com',
          password: 'password123',
        })
      ).rejects.toThrow();
    });

    it('should reject username with special characters', async () => {
      await expect(
        User.create({ username: 'user@name!', email: 'special@test.com', password: 'password123' })
      ).rejects.toThrow();
    });

    it('should allow underscores in username', async () => {
      const user = await createUser({ username: 'valid_user_123' });
      expect(user.username).toBe('valid_user_123');
    });

    it('should lowercase the username', async () => {
      const user = await createUser({ username: 'UpperCase' });
      expect(user.username).toBe('uppercase');
    });

    it('should lowercase the email', async () => {
      const user = await createUser({ email: 'UPPER@TEST.COM' });
      expect(user.email).toBe('upper@test.com');
    });

    it('should set default values correctly', async () => {
      const user = await createUser();
      expect(user.role).toBe('user');
      expect(user.status).toBe('active');
      expect(user.followersCount).toBe(0);
      expect(user.followingCount).toBe(0);
      expect(user.postsCount).toBe(0);
      expect(user.bio).toBe('');
      expect(user.avatar).toBe('');
    });

    it('should reject invalid role', async () => {
      await expect(
        createUser({ role: 'superadmin' })
      ).rejects.toThrow();
    });

    it('should reject invalid status', async () => {
      await expect(
        createUser({ status: 'deleted' })
      ).rejects.toThrow();
    });

    it('should allow valid roles', async () => {
      for (const role of ['user', 'moderator', 'admin']) {
        const user = await createUser({ role });
        expect(user.role).toBe(role);
      }
    });

    it('should enforce bio maxlength (500)', async () => {
      await expect(
        createUser({ bio: 'x'.repeat(501) })
      ).rejects.toThrow();
    });

    it('should enforce displayName maxlength (50)', async () => {
      await expect(
        createUser({ displayName: 'x'.repeat(51) })
      ).rejects.toThrow();
    });
  });

  // ── Password Hashing ──────────────────────────────────
  describe('Password Hashing', () => {
    it('should hash password on save', async () => {
      const user = await User.create({
        username: 'hashtest',
        email: 'hashtest@test.com',
        password: 'plaintext123',
      });
      const dbUser = await User.findById(user._id).select('+password');
      expect(dbUser.password).not.toBe('plaintext123');
      expect(dbUser.password).toMatch(/^\$2[ab]\$/); // bcrypt hash
    });

    it('should not re-hash password if not modified', async () => {
      const user = await User.create({
        username: 'norehash',
        email: 'norehash@test.com',
        password: 'password123',
      });
      const dbUser = await User.findById(user._id).select('+password');
      const originalHash = dbUser.password;

      dbUser.displayName = 'Updated Name';
      await dbUser.save();

      const refreshed = await User.findById(user._id).select('+password');
      expect(refreshed.password).toBe(originalHash);
    });
  });

  // ── Instance Methods ──────────────────────────────────
  describe('Instance Methods', () => {
    it('comparePassword should return true for correct password', async () => {
      const user = await User.create({
        username: 'comparetest',
        email: 'compare@test.com',
        password: 'correctpassword',
      });
      const dbUser = await User.findById(user._id).select('+password');
      const isMatch = await dbUser.comparePassword('correctpassword');
      expect(isMatch).toBe(true);
    });

    it('comparePassword should return false for wrong password', async () => {
      const user = await User.create({
        username: 'comparewrong',
        email: 'comparewrong@test.com',
        password: 'correctpassword',
      });
      const dbUser = await User.findById(user._id).select('+password');
      const isMatch = await dbUser.comparePassword('wrongpassword');
      expect(isMatch).toBe(false);
    });
  });

  // ── Field Selection ────────────────────────────────────
  describe('Field Selection', () => {
    it('should not include password by default', async () => {
      const user = await createUser();
      const fetched = await User.findById(user._id);
      expect(fetched.password).toBeUndefined();
    });

    it('should include password with explicit select', async () => {
      const user = await createUser();
      const fetched = await User.findById(user._id).select('+password');
      expect(fetched.password).toBeDefined();
    });

    it('should not include refreshToken by default', async () => {
      const user = await createUser();
      const fetched = await User.findById(user._id);
      expect(fetched.refreshToken).toBeUndefined();
    });
  });
});

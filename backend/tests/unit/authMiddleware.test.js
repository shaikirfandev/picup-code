/**
 * Unit Tests — Auth Middleware
 *
 * Tests JWT authentication, optional auth, banned/suspended checks, and token generation.
 */
const jwt = require('jsonwebtoken');
const { authenticate, optionalAuth, generateTokens } = require('../../src/middleware/auth');
const { createUser, generateToken, randomObjectId } = require('../helpers/factories');

// Mock Express req/res/next
function mockReq(overrides = {}) {
  return {
    headers: {},
    ...overrides,
  };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Auth Middleware', () => {
  describe('authenticate()', () => {
    it('should reject request with no Authorization header', async () => {
      const req = mockReq();
      const res = mockRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Access denied'),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with non-Bearer token', async () => {
      const req = mockReq({ headers: { authorization: 'Basic xyz' } });
      const res = mockRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should reject request with invalid JWT', async () => {
      const req = mockReq({ headers: { authorization: 'Bearer invalid.token.here' } });
      const res = mockRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Invalid token') })
      );
    });

    it('should reject request with expired JWT', async () => {
      const token = jwt.sign({ id: randomObjectId() }, process.env.JWT_SECRET, { expiresIn: '0s' });
      // Small delay to ensure expiry
      await new Promise((r) => setTimeout(r, 50));

      const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
      const res = mockRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('expired') })
      );
    });

    it('should reject request for non-existent user', async () => {
      const token = generateToken(randomObjectId());
      const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
      const res = mockRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('User not found') })
      );
    });

    it('should reject banned user', async () => {
      const user = await createUser({ status: 'banned' });
      const token = generateToken(user._id);
      const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
      const res = mockRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('banned') })
      );
    });

    it('should reject suspended user', async () => {
      const user = await createUser({ status: 'suspended' });
      const token = generateToken(user._id);
      const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
      const res = mockRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('suspended') })
      );
    });

    it('should authenticate valid user and set req.user', async () => {
      const user = await createUser();
      const token = generateToken(user._id);
      const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
      const res = mockRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(user._id.toString());
      expect(req.user.password).toBeUndefined(); // select: false
    });
  });

  describe('optionalAuth()', () => {
    it('should continue without error when no token provided', async () => {
      const req = mockReq();
      const res = mockRes();
      const next = jest.fn();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should set req.user when valid token provided', async () => {
      const user = await createUser();
      const token = generateToken(user._id);
      const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
      const res = mockRes();
      const next = jest.fn();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(user._id.toString());
    });

    it('should continue without error when invalid token provided', async () => {
      const req = mockReq({ headers: { authorization: 'Bearer bad.token' } });
      const res = mockRes();
      const next = jest.fn();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should not set user for banned users', async () => {
      const user = await createUser({ status: 'banned' });
      const token = generateToken(user._id);
      const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
      const res = mockRes();
      const next = jest.fn();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  });

  describe('generateTokens()', () => {
    it('should return access and refresh tokens', () => {
      const userId = randomObjectId();
      const tokens = generateTokens(userId);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should create valid JWT access tokens', () => {
      const userId = randomObjectId();
      const { accessToken } = generateTokens(userId);

      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      expect(decoded.id).toBe(userId.toString());
    });

    it('should create valid JWT refresh tokens', () => {
      const userId = randomObjectId();
      const { refreshToken } = generateTokens(userId);

      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );
      expect(decoded.id).toBe(userId.toString());
    });

    it('should generate different tokens for different users', () => {
      const tokens1 = generateTokens(randomObjectId());
      const tokens2 = generateTokens(randomObjectId());

      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });
  });
});

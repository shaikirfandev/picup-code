/**
 * Per-suite setup file — connects mongoose to in-memory MongoDB,
 * sets required env vars, and cleans up between tests.
 */
const mongoose = require('mongoose');

// Set test env vars before anything else
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-12345';
process.env.JWT_EXPIRES_IN = '7d';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.PORT = '0'; // random port in test

// Mock rate limiter — bypass all rate limiting in tests
jest.mock('../../src/middleware/rateLimiter', () => {
  const passthrough = (req, res, next) => next();
  return {
    globalLimiter: passthrough,
    authLimiter: passthrough,
    aiLimiter: passthrough,
    uploadLimiter: passthrough,
    searchLimiter: passthrough,
    reportLimiter: passthrough,
  };
});

beforeAll(async () => {
  // Connect to the in-memory MongoDB
  const uri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27018/test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

afterEach(async () => {
  // Clean all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

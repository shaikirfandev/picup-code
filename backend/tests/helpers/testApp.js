/**
 * Test Express app factory — builds the Express app without starting
 * the HTTP server, Socket.io, or background workers.
 * This is the isolated app used by Supertest for integration tests.
 */
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const configurePassport = require('../../src/config/passport');

function createTestApp() {
  const app = express();

  // Core middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(passport.initialize());
  configurePassport(passport);

  // Mount routes
  app.use('/api/auth', require('../../src/routes/auth'));
  app.use('/api/users', require('../../src/routes/users'));
  app.use('/api/posts', require('../../src/routes/posts'));
  app.use('/api/comments', require('../../src/routes/comments'));
  app.use('/api/search', require('../../src/routes/search'));
  app.use('/api/notifications', require('../../src/routes/notifications'));
  app.use('/api/payments', require('../../src/routes/payments'));
  app.use('/api/creator-dashboard', require('../../src/routes/creatorDashboard'));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: err.message || 'Internal Server Error',
    });
  });

  // 404
  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  return app;
}

module.exports = createTestApp;

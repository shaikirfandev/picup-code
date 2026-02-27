require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');
const { initGridFS } = require('./config/gridfs');
const configurePassport = require('./config/passport');
const { globalLimiter } = require('./middleware/rateLimiter');
const notificationService = require('./services/notificationService');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const boardRoutes = require('./routes/boards');
const commentRoutes = require('./routes/comments');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const searchRoutes = require('./routes/search');
const categoryRoutes = require('./routes/categories');
const uploadRoutes = require('./routes/upload');
const fileRoutes = require('./routes/files');
const blogRoutes = require('./routes/blog');
const adRoutes = require('./routes/ads');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');
const adminPostRoutes = require('./routes/adminPosts');
const adminBlogRoutes = require('./routes/adminBlogs');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const server = http.createServer(app);

// ------ Socket.io Setup ------
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Provide io to the notification service
notificationService.setIO(io);

// Socket.io auth middleware — verify JWT on handshake
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id || decoded._id;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.userId;
  // Join personal room
  socket.join(`user:${userId}`);
  console.log(`🔌 Socket connected: user ${userId}`);

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: user ${userId}`);
  });
});

// Connect to MongoDB, then init GridFS buckets
connectDB().then(() => {
  initGridFS();
});

// Configure Passport
configurePassport(passport);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(passport.initialize());
app.use(globalLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/posts-manage', adminPostRoutes);
app.use('/api/admin/blogs-manage', adminBlogRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`🚀 PicUp API running on port ${PORT}`);
  console.log(`📌 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Socket.io ready`);

  // Schedule daily stats computation — runs every hour, computes yesterday's stats
  const { computeDailyStats, resetDailyActiveFlags } = require('./utils/dailyStatsComputer');
  setInterval(() => {
    const now = new Date();
    // At midnight (0th hour), reset active flags and compute yesterday's stats
    if (now.getHours() === 0 && now.getMinutes() < 5) {
      resetDailyActiveFlags();
      computeDailyStats(); // defaults to yesterday
    }
  }, 5 * 60 * 1000); // Check every 5 minutes

  // Compute yesterday's stats on startup (if not already computed)
  computeDailyStats().catch(() => {});
});

module.exports = { app, server, io };

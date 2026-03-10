/**
 * Analytics WebSocket Handler
 * 
 * Real-time analytics streaming via Socket.io.
 * Authenticated users can subscribe to:
 * - Creator-level live stats (analytics:creator:{userId})
 * - Post-level live stats (analytics:post:{postId})
 * 
 * Auto-pushes updates every 5 seconds to subscribed clients.
 */
const jwt = require('jsonwebtoken');
const {
  getRealtimeCreatorCounters,
  getRealtimePostCounters,
  getLiveViewerCount,
} = require('../services/analyticsEventService');

let analyticsIntervals = new Map();

/**
 * Setup analytics namespace on existing Socket.io instance.
 */
function setupAnalyticsSocket(io) {
  const analyticsNsp = io.of('/analytics');

  // Auth middleware
  analyticsNsp.use((socket, next) => {
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

  analyticsNsp.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`📊 Analytics socket connected: user ${userId}`);

    // Join creator analytics room
    socket.join(`creator:${userId}`);

    // Subscribe to post-level analytics
    socket.on('subscribe:post', async (postId) => {
      socket.join(`post:${postId}`);

      // Send immediate data
      const [counters, liveViewers] = await Promise.all([
        getRealtimePostCounters(postId),
        getLiveViewerCount(postId),
      ]);

      socket.emit('post:stats', {
        postId,
        ...counters,
        liveViewers,
        timestamp: Date.now(),
      });
    });

    socket.on('unsubscribe:post', (postId) => {
      socket.leave(`post:${postId}`);
    });

    // Send initial creator stats
    (async () => {
      const counters = await getRealtimeCreatorCounters(userId);
      socket.emit('creator:stats', {
        ...counters,
        timestamp: Date.now(),
      });
    })();

    socket.on('disconnect', () => {
      console.log(`📊 Analytics socket disconnected: user ${userId}`);
    });
  });

  // ── Periodic broadcast every 5 seconds ──
  const broadcastInterval = setInterval(async () => {
    const rooms = analyticsNsp.adapter.rooms;

    for (const [roomName] of rooms) {
      try {
        // Creator rooms
        if (roomName.startsWith('creator:')) {
          const crUserId = roomName.split(':')[1];
          const counters = await getRealtimeCreatorCounters(crUserId);
          analyticsNsp.to(roomName).emit('creator:stats', {
            ...counters,
            timestamp: Date.now(),
          });
        }

        // Post rooms
        if (roomName.startsWith('post:')) {
          const postId = roomName.split(':')[1];
          const [counters, liveViewers] = await Promise.all([
            getRealtimePostCounters(postId),
            getLiveViewerCount(postId),
          ]);
          analyticsNsp.to(roomName).emit('post:stats', {
            postId,
            ...counters,
            liveViewers,
            timestamp: Date.now(),
          });
        }
      } catch (err) {
        // Silently ignore broadcast errors
      }
    }
  }, 5000);

  // Cleanup on server shutdown
  process.on('SIGTERM', () => clearInterval(broadcastInterval));
  process.on('SIGINT', () => clearInterval(broadcastInterval));

  return analyticsNsp;
}

module.exports = { setupAnalyticsSocket };

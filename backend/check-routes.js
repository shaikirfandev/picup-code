const routes = [
  ['auth', './src/routes/auth'],
  ['users', './src/routes/users'],
  ['posts', './src/routes/posts'],
  ['boards', './src/routes/boards'],
  ['comments', './src/routes/comments'],
  ['admin', './src/routes/admin'],
  ['ai', './src/routes/ai'],
  ['search', './src/routes/search'],
  ['categories', './src/routes/categories'],
  ['upload', './src/routes/upload'],
  ['files', './src/routes/files'],
  ['blog', './src/routes/blog'],
  ['payments', './src/routes/payments'],
  ['notifications', './src/routes/notifications'],
  ['adminPosts', './src/routes/adminPosts'],
  ['adminBlogs', './src/routes/adminBlogs'],
  ['analytics', './src/routes/analytics'],
  ['creatorAnalytics', './src/routes/creatorAnalytics'],
  ['creatorDashboard', './src/routes/creatorDashboard'],
];

routes.forEach(([name, path]) => {
  try {
    const m = require(path);
    console.log(name + ': ' + (typeof m === 'function' ? 'OK' : 'BAD type=' + typeof m));
  } catch(e) {
    console.log(name + ': ERROR - ' + e.message.split('\n')[0]);
  }
});

// Also check middleware
try {
  const { globalLimiter, walletLimiter, adminLimiter, notificationsLimiter } = require('./src/middleware/rateLimiter');
  console.log('globalLimiter: ' + typeof globalLimiter);
  console.log('walletLimiter: ' + typeof walletLimiter);
  console.log('adminLimiter: ' + typeof adminLimiter);
  console.log('notificationsLimiter: ' + typeof notificationsLimiter);
} catch(e) {
  console.log('rateLimiter: ERROR - ' + e.message);
}

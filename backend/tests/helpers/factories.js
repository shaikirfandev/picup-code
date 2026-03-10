/**
 * Test factory helpers — create valid test data quickly.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const Post = require('../../src/models/Post');
const Comment = require('../../src/models/Comment');

let counter = 0;

function uniqueId() {
  counter += 1;
  // Include pid + timestamp fragment to avoid collisions across parallel workers
  return `${process.pid}_${Date.now().toString(36)}_${counter}`;
}

/**
 * Create a user in the database with sensible defaults.
 */
async function createUser(overrides = {}) {
  const id = uniqueId();
  const password = overrides.password || 'password123';
  const hashed = await bcrypt.hash(password, 4); // low rounds for speed

  const user = await User.create({
    username: overrides.username || `testuser${id}`,
    email: overrides.email || `testuser${id}@test.com`,
    password: hashed,
    displayName: overrides.displayName || `Test User ${id}`,
    status: 'active',
    isVerified: true,
    ...overrides,
    // Don't override password with un-hashed value
    password: hashed,
  });

  return user;
}

/**
 * Create a user and return it with a valid JWT access token.
 */
async function createAuthenticatedUser(overrides = {}) {
  const user = await createUser(overrides);
  const token = jwt.sign(
    { id: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  return { user, token };
}

/**
 * Create an admin user with a valid token.
 */
async function createAdminUser(overrides = {}) {
  return createAuthenticatedUser({ role: 'admin', ...overrides });
}

/**
 * Create a post in the database with sensible defaults.
 */
async function createPost(authorId, overrides = {}) {
  const id = uniqueId();
  const post = await Post.create({
    title: overrides.title || `Test Post ${id}`,
    description: overrides.description || `Description for test post ${id}`,
    mediaType: 'image',
    image: { url: `https://example.com/image${id}.jpg` },
    author: authorId,
    status: 'published',
    tags: overrides.tags || ['test', 'sample'],
    ...overrides,
  });
  return post;
}

/**
 * Create a comment on a post.
 */
async function createComment(postId, userId, overrides = {}) {
  const id = uniqueId();
  const comment = await Comment.create({
    text: overrides.text || `Test comment ${id}`,
    post: postId,
    user: userId,
    ...overrides,
  });
  return comment;
}

/**
 * Generate a valid JWT for an existing user ID.
 */
function generateToken(userId) {
  return jwt.sign(
    { id: userId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Generate a valid refresh token.
 */
function generateRefreshToken(userId) {
  return jwt.sign(
    { id: userId.toString() },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

/**
 * Generate a random MongoDB ObjectId.
 */
function randomObjectId() {
  return new mongoose.Types.ObjectId();
}

module.exports = {
  createUser,
  createAuthenticatedUser,
  createAdminUser,
  createPost,
  createComment,
  generateToken,
  generateRefreshToken,
  randomObjectId,
};

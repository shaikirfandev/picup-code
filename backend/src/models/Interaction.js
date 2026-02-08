const mongoose = require('mongoose');

// Like Schema
const likeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  },
  { timestamps: true }
);
likeSchema.index({ user: 1, post: 1 }, { unique: true });
likeSchema.index({ post: 1 });

const Like = mongoose.model('Like', likeSchema);

// Save Schema
const saveSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board' },
  },
  { timestamps: true }
);
saveSchema.index({ user: 1, post: 1 }, { unique: true });
saveSchema.index({ user: 1, board: 1 });

const Save = mongoose.model('Save', saveSchema);

// Follow Schema
const followSchema = new mongoose.Schema(
  {
    follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);
followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ following: 1 });
followSchema.index({ follower: 1 });

const Follow = mongoose.model('Follow', followSchema);

module.exports = { Like, Save, Follow };

const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    posts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    }],
    isPrivate: {
      type: Boolean,
      default: false,
    },
    postsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

boardSchema.index({ user: 1, createdAt: -1 });
boardSchema.index({ name: 'text' });

module.exports = mongoose.model('Board', boardSchema);

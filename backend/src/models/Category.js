const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '📌',
    },
    color: {
      type: String,
      default: '#6366f1',
    },
    image: String,
    postsCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('Category', categorySchema);

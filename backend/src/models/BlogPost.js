const mongoose = require('mongoose');
const slugify = require('slugify');

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      unique: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    excerpt: {
      type: String,
      maxlength: 500,
      default: '',
    },
    coverImage: {
      url: String,
      publicId: String,
      fileId: String,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    category: {
      type: String,
      enum: ['technology', 'ai', 'web-development', 'mobile', 'cloud', 'cybersecurity', 'gadgets', 'software', 'tutorials', 'news', 'other'],
      default: 'technology',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
    },
    viewsCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    readTime: { type: Number, default: 1 }, // minutes
    reportCount: { type: Number, default: 0 },

    // Soft-delete fields
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deleteReason: { type: String, maxlength: 500 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

blogPostSchema.index({ author: 1, createdAt: -1 });
blogPostSchema.index({ status: 1, createdAt: -1 });
blogPostSchema.index({ tags: 1 });
blogPostSchema.index({ category: 1 });
blogPostSchema.index({ title: 'text', content: 'text', tags: 'text' });

blogPostSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }
  // Calculate read time (~200 words per minute)
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.max(1, Math.ceil(wordCount / 200));
  }
  if (this.isModified('content') && !this.excerpt) {
    this.excerpt = this.content.replace(/<[^>]*>/g, '').substring(0, 300);
  }
  next();
});

module.exports = mongoose.model('BlogPost', blogPostSchema);

const mongoose = require('mongoose');
const slugify = require('slugify');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 150,
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      maxlength: 2000,
      default: '',
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    image: {
      url: { type: String },
      publicId: String,
      fileId: String,
      thumbnailUrl: String,
      width: Number,
      height: Number,
      blurHash: String,
      dominantColor: String,
    },
    video: {
      url: { type: String },
      publicId: String,
      fileId: String,
      thumbnailUrl: String,
      duration: Number,        // seconds
      width: Number,
      height: Number,
      format: String,
      bytes: Number,
    },
    thumbnails: {
      small: String,   // 200px
      medium: String,  // 400px
      large: String,   // 800px
    },
    productUrl: {
      type: String,
      default: '',
    },
    price: {
      amount: { type: Number, min: 0 },
      currency: { type: String, default: 'USD' },
      display: String,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'published', 'rejected', 'archived'],
      default: 'published',
    },
    isAiGenerated: {
      type: Boolean,
      default: false,
    },
    aiMetadata: {
      prompt: String,
      model: String,
      seed: Number,
      style: String,
    },
    likesCount: { type: Number, default: 0 },
    savesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    clicksCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },
    isNSFW: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },

    // Soft-delete fields
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deleteReason: { type: String, maxlength: 500 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ category: 1 });
postSchema.index({ title: 'text', description: 'text', tags: 'text' });
postSchema.index({ likesCount: -1 });
postSchema.index({ viewsCount: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ isFeatured: 1, createdAt: -1 });
postSchema.index({ isDeleted: 1 });
postSchema.index({ deletedAt: 1 });

// Generate slug before saving & validate media
postSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }
  if (this.price?.amount) {
    this.price.display = `$${this.price.amount.toFixed(2)}`;
  }
  // Validate: must have either image or video
  if (!this.image?.url && !this.video?.url) {
    return next(new Error('Post must have an image or a video'));
  }
  // Auto-set mediaType
  if (this.video?.url && !this.image?.url) {
    this.mediaType = 'video';
  }
  next();
});

// Virtual for post URL
postSchema.virtual('postUrl').get(function () {
  return `/post/${this._id}`;
});

// Virtual for aspect ratio
postSchema.virtual('aspectRatio').get(function () {
  if (this.mediaType === 'video' && this.video?.width && this.video?.height) {
    return this.video.height / this.video.width;
  }
  if (this.image?.width && this.image?.height) {
    return this.image.height / this.image.width;
  }
  return 1.5; // default aspect ratio
});

module.exports = mongoose.model('Post', postSchema);

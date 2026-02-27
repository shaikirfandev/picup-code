const BlogPost = require('../models/BlogPost');
const User = require('../models/User');
const Report = require('../models/Report');
const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');
const { uploadImageToGridFS, uploadThumbnailToGridFS } = require('../config/gridfs');

// Get all published blog posts
exports.getBlogPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, category, tag, sort = 'recent', search } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = { status: 'published', isDeleted: { $ne: true } };
    if (category) filter.category = category;
    if (tag) filter.tags = tag.toLowerCase();
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { viewsCount: -1, createdAt: -1 };
    if (sort === 'trending') sortOption = { likesCount: -1, createdAt: -1 };
    if (sort === 'featured') {
      filter.isFeatured = true;
      sortOption = { createdAt: -1 };
    }

    const [posts, total] = await Promise.all([
      BlogPost.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('author', 'username displayName avatar')
        .lean(),
      BlogPost.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, posts, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// Get single blog post
exports.getBlogPost = async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug, status: 'published', isDeleted: { $ne: true } })
      .populate('author', 'username displayName avatar bio');

    if (!post) return ApiResponse.notFound(res, 'Blog post not found');

    // Increment views
    await BlogPost.findByIdAndUpdate(post._id, { $inc: { viewsCount: 1 } });

    ApiResponse.success(res, { ...post.toObject(), viewsCount: post.viewsCount + 1 });
  } catch (error) {
    next(error);
  }
};

// Create blog post (authenticated users)
exports.createBlogPost = async (req, res, next) => {
  try {
    const { title, content, excerpt, tags, category } = req.body;

    let coverImage;
    if (req.file) {
      const result = await uploadImageToGridFS(req.file.buffer, req.file.originalname, req.file.mimetype);
      const thumb = await uploadThumbnailToGridFS(req.file.buffer, req.file.originalname);
      coverImage = { url: result.url, fileId: result.fileId };
    }

    const post = await BlogPost.create({
      title,
      content,
      excerpt: excerpt || undefined,
      coverImage: coverImage || undefined,
      tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
      category: category || 'technology',
      author: req.user._id,
    });

    const populated = await BlogPost.findById(post._id)
      .populate('author', 'username displayName avatar');

    ApiResponse.created(res, populated, 'Blog post created');
  } catch (error) {
    next(error);
  }
};

// Update blog post (owner or admin)
exports.updateBlogPost = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return ApiResponse.notFound(res, 'Blog post not found');

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, 'Not authorized');
    }

    const { title, content, excerpt, tags, category, status } = req.body;
    if (title) post.title = title;
    if (content) post.content = content;
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (tags) post.tags = Array.isArray(tags) ? tags : JSON.parse(tags);
    if (category) post.category = category;
    if (status && req.user.role === 'admin') post.status = status;

    if (req.file) {
      const result = await uploadImageToGridFS(req.file.buffer, req.file.originalname, req.file.mimetype);
      post.coverImage = { url: result.url, fileId: result.fileId };
    }

    await post.save();
    const updated = await BlogPost.findById(post._id)
      .populate('author', 'username displayName avatar');

    ApiResponse.success(res, updated, 'Blog post updated');
  } catch (error) {
    next(error);
  }
};

// Delete blog post
exports.deleteBlogPost = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return ApiResponse.notFound(res, 'Blog post not found');

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, 'Not authorized');
    }

    await post.deleteOne();
    ApiResponse.success(res, null, 'Blog post deleted');
  } catch (error) {
    next(error);
  }
};

// Get my blog posts
exports.getMyBlogPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip } = paginate(null, page, limit);

    const [posts, total] = await Promise.all([
      BlogPost.find({ author: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      BlogPost.countDocuments({ author: req.user._id }),
    ]);

    ApiResponse.paginated(res, posts, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// Get blog categories list
exports.getBlogCategories = async (req, res, next) => {
  try {
    const categories = [
      { id: 'technology', name: 'Technology', icon: '💻' },
      { id: 'ai', name: 'Artificial Intelligence', icon: '🤖' },
      { id: 'web-development', name: 'Web Development', icon: '🌐' },
      { id: 'mobile', name: 'Mobile', icon: '📱' },
      { id: 'cloud', name: 'Cloud Computing', icon: '☁️' },
      { id: 'cybersecurity', name: 'Cybersecurity', icon: '🔒' },
      { id: 'gadgets', name: 'Gadgets', icon: '🔧' },
      { id: 'software', name: 'Software', icon: '💾' },
      { id: 'tutorials', name: 'Tutorials', icon: '📚' },
      { id: 'news', name: 'Tech News', icon: '📰' },
      { id: 'other', name: 'Other', icon: '📌' },
    ];
    ApiResponse.success(res, categories);
  } catch (error) {
    next(error);
  }
};

// Report blog post
exports.reportBlogPost = async (req, res, next) => {
  try {
    const { reason, description } = req.body;
    const blogPost = await BlogPost.findById(req.params.id);
    if (!blogPost) return ApiResponse.notFound(res, 'Blog post not found');

    // Self-report prevention
    if (blogPost.author.toString() === req.user._id.toString()) {
      return ApiResponse.error(res, 'You cannot report your own article', 400);
    }

    // Duplicate check
    const existingReport = await Report.findOne({
      reporter: req.user._id,
      blogPost: blogPost._id,
      status: 'pending',
    });

    if (existingReport) {
      return ApiResponse.error(res, 'You have already reported this article', 400);
    }

    await Report.create({
      reporter: req.user._id,
      blogPost: blogPost._id,
      reportedUser: blogPost.author,
      reason,
      description,
    });

    const newReportCount = (blogPost.reportCount || 0) + 1;
    const updateFields = { $inc: { reportCount: 1 } };

    // Auto-flag: hide blog post when report count exceeds threshold
    if (newReportCount >= Report.AUTO_FLAG_THRESHOLD && blogPost.status === 'published') {
      updateFields.$set = { status: 'archived' };
      // Also mark all pending reports as auto-flagged
      await Report.updateMany(
        { blogPost: blogPost._id, status: 'pending' },
        { autoFlagged: true }
      );
    }

    await BlogPost.findByIdAndUpdate(blogPost._id, updateFields);

    ApiResponse.success(res, null, 'Article reported. We will review it shortly.');
  } catch (error) {
    next(error);
  }
};

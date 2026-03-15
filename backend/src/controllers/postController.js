const Post = require('../models/Post');
const User = require('../models/User');
const { Like, Save } = require('../models/Interaction');
const Report = require('../models/Report');
const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');
const { uploadImageToGridFS, uploadThumbnailToGridFS, uploadVideoToGridFS } = require('../config/gridfs');
const notificationService = require('../services/notificationService');
const { trackAffiliateClick } = require('../services/analyticsEventService');

// Create post — files go to MongoDB GridFS
exports.createPost = async (req, res, next) => {
  try {
    const { title, description, productUrl, tags, category, price, isAiGenerated, aiImageUrl, aiMetadata, mediaType, videoData, affiliateLinks } = req.body;

    let imageData;
    let videoDataResult;
    let postMediaType = mediaType || 'image';

    if (postMediaType === 'video') {
      /* ── Video post ────────────────────────────── */
      if (req.file) {
        const result = await uploadVideoToGridFS(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        videoDataResult = {
          url: result.url,
          fileId: result.fileId,
          bytes: result.size,
        };
      } else if (videoData) {
        videoDataResult = typeof videoData === 'string' ? JSON.parse(videoData) : videoData;
      } else {
        return ApiResponse.error(res, 'Video is required for video posts', 400);
      }
    } else {
      /* ── Image post ────────────────────────────── */
      if (isAiGenerated && aiImageUrl) {
        imageData = { url: aiImageUrl };
      } else if (req.file) {
        const result = await uploadImageToGridFS(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        // Also generate a thumbnail
        const thumb = await uploadThumbnailToGridFS(
          req.file.buffer,
          req.file.originalname
        );
        imageData = {
          url: result.url,
          fileId: result.fileId,
          width: result.width,
          height: result.height,
          thumbnailUrl: thumb.url,
        };
      } else {
        return ApiResponse.error(res, 'Image is required', 400);
      }
    }

    // Parse affiliate links if provided
    let parsedAffiliateLinks = [];
    if (affiliateLinks) {
      parsedAffiliateLinks = typeof affiliateLinks === 'string' ? JSON.parse(affiliateLinks) : affiliateLinks;
    }
    const hasAffiliateContent = !!(productUrl?.trim()) || parsedAffiliateLinks.length > 0;

    const post = await Post.create({
      title,
      description,
      mediaType: postMediaType,
      image: imageData || undefined,
      video: videoDataResult || undefined,
      productUrl: productUrl || undefined,
      affiliateLinks: parsedAffiliateLinks,
      isAffiliate: hasAffiliateContent,
      tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
      category: category || undefined,
      price: price ? (typeof price === 'string' ? JSON.parse(price) : price) : undefined,
      author: req.user._id,
      isAiGenerated: !!isAiGenerated,
      aiMetadata: aiMetadata ? (typeof aiMetadata === 'string' ? JSON.parse(aiMetadata) : aiMetadata) : undefined,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } });

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username displayName avatar')
      .populate('category', 'name slug');

    ApiResponse.created(res, populatedPost, 'Post created successfully');
  } catch (error) {
    next(error);
  }
};

// Get feed posts (infinite scroll)
exports.getFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, category, tag, sort = 'recent' } = req.query;
    const { skip } = paginate(null, page, limit);

    const filter = { status: 'published' };
    if (category) filter.category = category;
    if (tag) filter.tags = tag.toLowerCase();

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { likesCount: -1, createdAt: -1 };
    if (sort === 'trending') sortOption = { viewsCount: -1, createdAt: -1 };
    if (sort === 'featured') {
      filter.isFeatured = true;
      sortOption = { createdAt: -1 };
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('author', 'username displayName avatar')
        .populate('category', 'name slug color')
        .lean(),
      Post.countDocuments(filter),
    ]);

    // Add user interaction status if authenticated
    if (req.user) {
      const postIds = posts.map((p) => p._id);
      const [likes, saves] = await Promise.all([
        Like.find({ user: req.user._id, post: { $in: postIds } }).lean(),
        Save.find({ user: req.user._id, post: { $in: postIds } }).lean(),
      ]);

      const likedSet = new Set(likes.map((l) => l.post.toString()));
      const savedSet = new Set(saves.map((s) => s.post.toString()));

      posts.forEach((post) => {
        post.isLiked = likedSet.has(post._id.toString());
        post.isSaved = savedSet.has(post._id.toString());
      });
    }

    ApiResponse.paginated(res, posts, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

// Get single post
exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username displayName avatar bio followersCount')
      .populate('category', 'name slug color');

    if (!post || post.status !== 'published') {
      return ApiResponse.notFound(res, 'Post not found');
    }

    // Increment views
    await Post.findByIdAndUpdate(post._id, { $inc: { viewsCount: 1 } });

    let isLiked = false;
    let isSaved = false;
    let isFollowingAuthor = false;

    if (req.user) {
      const [like, save] = await Promise.all([
        Like.findOne({ user: req.user._id, post: post._id }),
        Save.findOne({ user: req.user._id, post: post._id }),
      ]);
      isLiked = !!like;
      isSaved = !!save;
    }

    // Get related posts
    const relatedPosts = await Post.find({
      _id: { $ne: post._id },
      status: 'published',
      $or: [
        { tags: { $in: post.tags } },
        { category: post.category?._id },
      ],
    })
      .sort({ likesCount: -1 })
      .limit(12)
      .populate('author', 'username displayName avatar')
      .lean();

    ApiResponse.success(res, {
      ...post.toObject(),
      viewsCount: post.viewsCount + 1,
      isLiked,
      isSaved,
      isFollowingAuthor,
      relatedPosts,
    });
  } catch (error) {
    next(error);
  }
};

// Like/Unlike post
exports.toggleLike = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const existing = await Like.findOne({ user: req.user._id, post: postId });

    if (existing) {
      await existing.deleteOne();
      await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });
      return ApiResponse.success(res, { isLiked: false }, 'Post unliked');
    }

    await Like.create({ user: req.user._id, post: postId });
    await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });

    // Notify post author about the like
    const likedPost = await Post.findById(postId).select('author title');
    if (likedPost) {
      notificationService.createNotification({
        recipient: likedPost.author,
        sender: req.user._id,
        type: 'like',
        post: postId,
        message: `${req.user.displayName || req.user.username} liked your post`,
      }).catch((err) => console.error('Like notification error:', err));
    }

    ApiResponse.success(res, { isLiked: true }, 'Post liked');
  } catch (error) {
    next(error);
  }
};

// Save/Unsave post
exports.toggleSave = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { boardId } = req.body;
    const existing = await Save.findOne({ user: req.user._id, post: postId });

    if (existing) {
      await existing.deleteOne();
      await Post.findByIdAndUpdate(postId, { $inc: { savesCount: -1 } });
      return ApiResponse.success(res, { isSaved: false }, 'Post unsaved');
    }

    await Save.create({
      user: req.user._id,
      post: postId,
      board: boardId || undefined,
    });
    await Post.findByIdAndUpdate(postId, { $inc: { savesCount: 1 } });

    // Notify post author about the save
    const savedPost = await Post.findById(postId).select('author title');
    if (savedPost) {
      notificationService.createNotification({
        recipient: savedPost.author,
        sender: req.user._id,
        type: 'save',
        post: postId,
        message: `${req.user.displayName || req.user.username} saved your post`,
      }).catch((err) => console.error('Save notification error:', err));
    }

    ApiResponse.success(res, { isSaved: true }, 'Post saved');
  } catch (error) {
    next(error);
  }
};

// Track click on product/affiliate URL
exports.trackClick = async (req, res, next) => {
  try {
    const { linkIndex } = req.body; // optional: which affiliate link was clicked
    const post = await Post.findById(req.params.id);
    if (!post) return ApiResponse.notFound(res, 'Post not found');

    // Increment total clicksCount
    post.clicksCount = (post.clicksCount || 0) + 1;

    // If a specific affiliate link was clicked, increment its counter
    let clickedUrl = post.productUrl;
    if (linkIndex !== undefined && post.affiliateLinks?.[linkIndex]) {
      post.affiliateLinks[linkIndex].clicks = (post.affiliateLinks[linkIndex].clicks || 0) + 1;
      clickedUrl = post.affiliateLinks[linkIndex].url;
    }
    await post.save();

    // Record detailed AffiliateClick for analytics (non-blocking)
    if (clickedUrl) {
      trackAffiliateClick({
        postId: post._id,
        ownerId: post.author,
        clickerId: req.user?._id || null,
        productUrl: clickedUrl,
        req,
        metadata: {
          referrer: req.body.referrer || 'unknown',
          country: req.body.country || null,
        },
      }).catch(() => {}); // fire and forget
    }

    ApiResponse.success(res, null, 'Click tracked');
  } catch (error) {
    next(error);
  }
};

// Redirect endpoint: /posts/:id/r/:linkIndex — track and redirect
exports.affiliateRedirect = async (req, res, next) => {
  try {
    const { id, linkIndex } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).send('Not found');

    let targetUrl;
    const idx = parseInt(linkIndex, 10);
    if (!isNaN(idx) && post.affiliateLinks?.[idx]) {
      targetUrl = post.affiliateLinks[idx].url;
      post.affiliateLinks[idx].clicks = (post.affiliateLinks[idx].clicks || 0) + 1;
    } else {
      targetUrl = post.productUrl;
    }

    if (!targetUrl) return res.status(404).send('No affiliate URL');

    post.clicksCount = (post.clicksCount || 0) + 1;
    await post.save();

    // Record AffiliateClick (non-blocking)
    trackAffiliateClick({
      postId: post._id,
      ownerId: post.author,
      clickerId: req.user?._id || null,
      productUrl: targetUrl,
      req,
      metadata: { referrer: req.query.ref || 'direct' },
    }).catch(() => {});

    return res.redirect(302, targetUrl);
  } catch (error) {
    next(error);
  }
};

// Share post
exports.sharePost = async (req, res, next) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, { $inc: { sharesCount: 1 } });
    ApiResponse.success(res, null, 'Share tracked');
  } catch (error) {
    next(error);
  }
};

// Report post
exports.reportPost = async (req, res, next) => {
  try {
    const { reason, description } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return ApiResponse.notFound(res, 'Post not found');

    // Self-report prevention
    if (post.author.toString() === req.user._id.toString()) {
      return ApiResponse.error(res, 'You cannot report your own post', 400);
    }

    const existingReport = await Report.findOne({
      reporter: req.user._id,
      post: post._id,
      status: 'pending',
    });

    if (existingReport) {
      return ApiResponse.error(res, 'You have already reported this post', 400);
    }

    await Report.create({
      reporter: req.user._id,
      post: post._id,
      reportedUser: post.author,
      reason,
      description,
    });

    const newReportCount = (post.reportCount || 0) + 1;
    const updateFields = { $inc: { reportCount: 1 } };

    // Auto-flag: hide post when report count exceeds threshold
    if (newReportCount >= Report.AUTO_FLAG_THRESHOLD && post.status === 'published') {
      updateFields.$set = { status: 'pending' };
      // Also mark all pending reports as auto-flagged
      await Report.updateMany(
        { post: post._id, status: 'pending' },
        { autoFlagged: true }
      );
    }

    await Post.findByIdAndUpdate(post._id, updateFields);

    ApiResponse.success(res, null, 'Post reported. We will review it shortly.');
  } catch (error) {
    next(error);
  }
};

// Delete post (owner or admin)
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return ApiResponse.notFound(res, 'Post not found');

    if (
      post.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return ApiResponse.forbidden(res, 'Not authorized to delete this post');
    }

    if (post.image?.publicId) {
      await deleteFromCloudinary(post.image.publicId);
    }

    await Promise.all([
      post.deleteOne(),
      User.findByIdAndUpdate(post.author, { $inc: { postsCount: -1 } }),
      Like.deleteMany({ post: post._id }),
      Save.deleteMany({ post: post._id }),
    ]);

    ApiResponse.success(res, null, 'Post deleted');
  } catch (error) {
    next(error);
  }
};

// Update post
exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return ApiResponse.notFound(res, 'Post not found');

    if (post.author.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'Not authorized');
    }

    const { title, description, productUrl, tags, category, price, affiliateLinks } = req.body;

    if (title) post.title = title;
    if (description !== undefined) post.description = description;
    if (productUrl !== undefined) post.productUrl = productUrl;
    if (affiliateLinks !== undefined) {
      post.affiliateLinks = typeof affiliateLinks === 'string' ? JSON.parse(affiliateLinks) : affiliateLinks;
    }
    // Recalculate isAffiliate flag
    post.isAffiliate = !!(post.productUrl?.trim()) || (post.affiliateLinks?.length > 0);
    if (tags) post.tags = Array.isArray(tags) ? tags : JSON.parse(tags);
    if (category) post.category = category;
    if (price) post.price = typeof price === 'string' ? JSON.parse(price) : price;

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'username displayName avatar')
      .populate('category', 'name slug');

    ApiResponse.success(res, updatedPost, 'Post updated');
  } catch (error) {
    next(error);
  }
};

// Get saved posts
exports.getSavedPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { skip } = paginate(null, page, limit);

    const [saves, total] = await Promise.all([
      Save.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate({
          path: 'post',
          populate: [
            { path: 'author', select: 'username displayName avatar' },
            { path: 'category', select: 'name slug' },
          ],
        }),
      Save.countDocuments({ user: req.user._id }),
    ]);

    const posts = saves.map((s) => s.post).filter(Boolean);
    ApiResponse.paginated(res, posts, getPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

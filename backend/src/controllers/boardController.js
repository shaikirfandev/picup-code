const Board = require('../models/Board');
const { Save } = require('../models/Interaction');
const { ApiResponse, paginate, getPaginationMeta } = require('../utils/apiResponse');

// Create board
exports.createBoard = async (req, res, next) => {
  try {
    const { name, description, isPrivate } = req.body;

    const board = await Board.create({
      name,
      description,
      isPrivate,
      user: req.user._id,
    });

    ApiResponse.created(res, board, 'Board created');
  } catch (error) {
    next(error);
  }
};

// Get user boards
exports.getUserBoards = async (req, res, next) => {
  try {
    const filter = { user: req.params.userId || req.user._id };
    if (req.params.userId && req.params.userId !== req.user?._id?.toString()) {
      filter.isPrivate = false;
    }

    const boards = await Board.find(filter)
      .sort({ createdAt: -1 })
      .populate({
        path: 'posts',
        options: { limit: 4 },
        select: 'image title',
      });

    ApiResponse.success(res, boards);
  } catch (error) {
    next(error);
  }
};

// Get board by ID
exports.getBoard = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { skip } = paginate(null, page, limit);

    const board = await Board.findById(req.params.id).populate('user', 'username displayName avatar');
    if (!board) return ApiResponse.notFound(res, 'Board not found');

    if (board.isPrivate && board.user._id.toString() !== req.user?._id?.toString()) {
      return ApiResponse.forbidden(res, 'This board is private');
    }

    const saves = await Save.find({ board: board._id, user: board.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'post',
        populate: [
          { path: 'author', select: 'username displayName avatar' },
          { path: 'category', select: 'name slug' },
        ],
      });

    const posts = saves.map((s) => s.post).filter(Boolean);
    const total = await Save.countDocuments({ board: board._id, user: board.user._id });

    ApiResponse.success(res, {
      board,
      posts,
      pagination: getPaginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

// Add post to board
exports.addToBoard = async (req, res, next) => {
  try {
    const { postId } = req.body;
    const board = await Board.findById(req.params.id);

    if (!board) return ApiResponse.notFound(res, 'Board not found');
    if (board.user.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res);
    }

    if (!board.posts.includes(postId)) {
      board.posts.push(postId);
      board.postsCount += 1;
      await board.save();
    }

    // Update the save record with board reference
    await Save.findOneAndUpdate(
      { user: req.user._id, post: postId },
      { board: board._id },
      { upsert: true }
    );

    ApiResponse.success(res, board, 'Post added to board');
  } catch (error) {
    next(error);
  }
};

// Remove post from board
exports.removeFromBoard = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return ApiResponse.notFound(res, 'Board not found');
    if (board.user.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res);
    }

    board.posts = board.posts.filter((p) => p.toString() !== req.params.postId);
    board.postsCount = Math.max(0, board.postsCount - 1);
    await board.save();

    ApiResponse.success(res, board, 'Post removed from board');
  } catch (error) {
    next(error);
  }
};

// Update board
exports.updateBoard = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return ApiResponse.notFound(res, 'Board not found');
    if (board.user.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res);
    }

    const { name, description, isPrivate } = req.body;
    if (name) board.name = name;
    if (description !== undefined) board.description = description;
    if (isPrivate !== undefined) board.isPrivate = isPrivate;

    await board.save();
    ApiResponse.success(res, board, 'Board updated');
  } catch (error) {
    next(error);
  }
};

// Delete board
exports.deleteBoard = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return ApiResponse.notFound(res, 'Board not found');
    if (board.user.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res);
    }

    await board.deleteOne();
    ApiResponse.success(res, null, 'Board deleted');
  } catch (error) {
    next(error);
  }
};

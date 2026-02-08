const Category = require('../models/Category');
const { ApiResponse } = require('../utils/apiResponse');

// Get all categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, name: 1 });
    ApiResponse.success(res, categories);
  } catch (error) {
    next(error);
  }
};

// Get category by slug
exports.getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true });
    if (!category) return ApiResponse.notFound(res, 'Category not found');
    ApiResponse.success(res, category);
  } catch (error) {
    next(error);
  }
};

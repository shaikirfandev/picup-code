class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(res, data = null, message = 'Created successfully') {
    return res.status(201).json({
      success: true,
      message,
      data,
    });
  }

  static paginated(res, data, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
    });
  }

  static error(res, message = 'Something went wrong', statusCode = 500) {
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }

  static notFound(res, message = 'Resource not found') {
    return res.status(404).json({
      success: false,
      message,
    });
  }

  static unauthorized(res, message = 'Unauthorized') {
    return res.status(401).json({
      success: false,
      message,
    });
  }

  static forbidden(res, message = 'Forbidden') {
    return res.status(403).json({
      success: false,
      message,
    });
  }
}

// Pagination helper
const paginate = (query, page = 1, limit = 20) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  return {
    skip,
    limit: parseInt(limit),
    page: parseInt(page),
  };
};

const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
    hasMore: parseInt(page) < totalPages,
  };
};

module.exports = { ApiResponse, paginate, getPaginationMeta };

const { uploadImageToGridFS, uploadThumbnailToGridFS, uploadVideoToGridFS } = require('../config/gridfs');
const { ApiResponse } = require('../utils/apiResponse');

// Upload image → MongoDB GridFS
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.error(res, 'No file uploaded', 400);
    }

    const result = await uploadImageToGridFS(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Also create a thumbnail
    const thumb = await uploadThumbnailToGridFS(
      req.file.buffer,
      req.file.originalname
    );

    ApiResponse.success(res, {
      url: result.url,
      fileId: result.fileId,
      thumbnailUrl: thumb.url,
      width: result.width,
      height: result.height,
    }, 'Image uploaded to MongoDB');
  } catch (error) {
    next(error);
  }
};

// Upload video → MongoDB GridFS
exports.uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.error(res, 'No video file uploaded', 400);
    }

    const result = await uploadVideoToGridFS(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    ApiResponse.success(res, {
      url: result.url,
      fileId: result.fileId,
      mimetype: result.mimetype,
      bytes: result.size,
    }, 'Video uploaded to MongoDB');
  } catch (error) {
    next(error);
  }
};

// Upload multiple images → MongoDB GridFS
exports.uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return ApiResponse.error(res, 'No files uploaded', 400);
    }

    const results = await Promise.all(
      req.files.map((file) =>
        uploadImageToGridFS(file.buffer, file.originalname, file.mimetype)
      )
    );

    ApiResponse.success(res, results, 'Images uploaded to MongoDB');
  } catch (error) {
    next(error);
  }
};

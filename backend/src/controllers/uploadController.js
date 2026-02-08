const { uploadToCloudinary, uploadVideoToCloudinary } = require('../config/cloudinary');
const { ApiResponse } = require('../utils/apiResponse');

const MAX_VIDEO_DURATION = 15; // seconds

// Upload image
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.error(res, 'No file uploaded', 400);
    }

    const result = await uploadToCloudinary(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
      { folder: 'picup/uploads' }
    );

    ApiResponse.success(res, {
      url: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
    }, 'Image uploaded');
  } catch (error) {
    next(error);
  }
};

// Upload video (10-15 seconds max)
exports.uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.error(res, 'No video file uploaded', 400);
    }

    // Upload to Cloudinary
    const result = await uploadVideoToCloudinary(req.file.buffer, {
      folder: 'picup/videos',
    });

    // Validate duration after upload (Cloudinary returns duration)
    if (result.duration && result.duration > MAX_VIDEO_DURATION) {
      // Delete the uploaded video since it's too long
      const { deleteFromCloudinary } = require('../config/cloudinary');
      await deleteFromCloudinary(result.publicId).catch(() => {});
      return ApiResponse.error(
        res,
        `Video is too long (${Math.round(result.duration)}s). Maximum allowed is ${MAX_VIDEO_DURATION} seconds.`,
        400
      );
    }

    ApiResponse.success(res, {
      url: result.url,
      publicId: result.publicId,
      thumbnailUrl: result.thumbnailUrl,
      width: result.width,
      height: result.height,
      duration: result.duration,
      format: result.format,
      bytes: result.bytes,
    }, 'Video uploaded');
  } catch (error) {
    next(error);
  }
};

// Upload multiple images
exports.uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return ApiResponse.error(res, 'No files uploaded', 400);
    }

    const results = await Promise.all(
      req.files.map((file) =>
        uploadToCloudinary(
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          { folder: 'picup/uploads' }
        )
      )
    );

    ApiResponse.success(res, results, 'Images uploaded');
  } catch (error) {
    next(error);
  }
};

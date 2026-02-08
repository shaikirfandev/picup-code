const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (filePath, options = {}) => {
  const defaultOptions = {
    folder: 'picup',
    resource_type: 'image',
    quality: 'auto:good',
    fetch_format: 'auto',
    transformation: [
      { width: 1200, crop: 'limit' },
      { quality: 'auto:good' },
    ],
  };

  const result = await cloudinary.uploader.upload(filePath, {
    ...defaultOptions,
    ...options,
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
};

const uploadVideoToCloudinary = async (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      folder: 'picup/videos',
      resource_type: 'video',
      eager: [
        // Generate a thumbnail
        { format: 'jpg', transformation: [{ width: 800, crop: 'limit' }] },
      ],
      eager_async: false,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      { ...defaultOptions, ...options },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          duration: result.duration,
          thumbnailUrl:
            result.eager && result.eager[0]
              ? result.eager[0].secure_url
              : result.secure_url.replace(/\.mp4$/, '.jpg'),
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

const deleteFromCloudinary = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

const getOptimizedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    ...options,
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadVideoToCloudinary,
  deleteFromCloudinary,
  getOptimizedUrl,
};

const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const { Readable } = require('stream');
const sharp = require('sharp');

let imageBucket;
let videoBucket;

/** Base URL for constructing absolute file URLs */
const getBaseUrl = () => {
  const port = process.env.PORT || 3002;
  return process.env.BASE_URL || `http://localhost:${port}`;
};

/**
 * Initialise GridFS buckets once the Mongoose connection is open.
 * Call this AFTER connectDB().
 */
const initGridFS = () => {
  const db = mongoose.connection.db;
  imageBucket = new GridFSBucket(db, { bucketName: 'images' });
  videoBucket = new GridFSBucket(db, { bucketName: 'videos' });
  console.log('🗄️  GridFS buckets initialised (images, videos)');
};

/* ─── helpers ─────────────────────────────────────────────────── */

const bufferToStream = (buffer) => {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
};

/* ─── IMAGE ───────────────────────────────────────────────────── */

/**
 * Store an image buffer in GridFS.
 * Automatically generates width/height metadata via sharp.
 * Returns { fileId, url, width, height, mimetype, size }.
 */
const uploadImageToGridFS = async (buffer, originalName, mimetype) => {
  // Get image dimensions
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // Optionally resize large images to max 1600px wide
  let processedBuffer = buffer;
  if (width > 1600) {
    processedBuffer = await sharp(buffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .toBuffer();
  }

  return new Promise((resolve, reject) => {
    const fileId = new mongoose.Types.ObjectId();
    const uploadStream = imageBucket.openUploadStreamWithId(fileId, originalName, {
      contentType: mimetype,
      metadata: { width, height, originalName },
    });

    bufferToStream(processedBuffer)
      .pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => {
        resolve({
          fileId: fileId.toString(),
          url: `${getBaseUrl()}/api/files/image/${fileId}`,
          width,
          height,
          mimetype,
          size: processedBuffer.length,
        });
      });
  });
};

/**
 * Generate a thumbnail (400px wide) and store it alongside in GridFS.
 */
const uploadThumbnailToGridFS = async (buffer, originalName) => {
  const thumbBuffer = await sharp(buffer)
    .resize({ width: 400, withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();

  return new Promise((resolve, reject) => {
    const fileId = new mongoose.Types.ObjectId();
    const uploadStream = imageBucket.openUploadStreamWithId(
      fileId,
      `thumb_${originalName}`,
      { contentType: 'image/jpeg', metadata: { isThumbnail: true } }
    );

    bufferToStream(thumbBuffer)
      .pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => {
        resolve({
          fileId: fileId.toString(),
          url: `${getBaseUrl()}/api/files/image/${fileId}`,
        });
      });
  });
};

/* ─── VIDEO ───────────────────────────────────────────────────── */

/**
 * Store a video buffer in GridFS.
 * Returns { fileId, url, mimetype, size }.
 */
const uploadVideoToGridFS = async (buffer, originalName, mimetype) => {
  return new Promise((resolve, reject) => {
    const fileId = new mongoose.Types.ObjectId();
    const uploadStream = videoBucket.openUploadStreamWithId(fileId, originalName, {
      contentType: mimetype,
      metadata: { originalName },
    });

    bufferToStream(buffer)
      .pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => {
        resolve({
          fileId: fileId.toString(),
          url: `${getBaseUrl()}/api/files/video/${fileId}`,
          mimetype,
          size: buffer.length,
        });
      });
  });
};

/* ─── STREAMING / RETRIEVAL ───────────────────────────────────── */

/**
 * Stream a file from GridFS to the Express response.
 * Supports Range requests for video seeking.
 */
const streamFile = async (bucketName, fileId, req, res) => {
  const db = mongoose.connection.db;
  const bucket = new GridFSBucket(db, { bucketName });
  const _id = new mongoose.Types.ObjectId(fileId);

  // Find file metadata
  const files = await bucket.find({ _id }).toArray();
  if (!files || files.length === 0) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }

  const file = files[0];
  const contentType = file.contentType || 'application/octet-stream';
  const fileSize = file.length;

  // Range support (for video seeking / progressive loading)
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    bucket.openDownloadStream(_id, { start, end: end + 1 }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    bucket.openDownloadStream(_id).pipe(res);
  }
};

/* ─── DELETE ──────────────────────────────────────────────────── */

const deleteFromGridFS = async (bucketName, fileId) => {
  try {
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName });
    await bucket.delete(new mongoose.Types.ObjectId(fileId));
  } catch (err) {
    console.warn(`GridFS delete failed for ${bucketName}/${fileId}:`, err.message);
  }
};

module.exports = {
  initGridFS,
  uploadImageToGridFS,
  uploadThumbnailToGridFS,
  uploadVideoToGridFS,
  streamFile,
  deleteFromGridFS,
};

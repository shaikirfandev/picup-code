const router = require('express').Router();
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const { streamFile } = require('../config/gridfs');
const { authenticate } = require('../middleware/auth');

// Allow cross-origin access for all file routes (images/videos loaded by <img>/<video> on frontend)
router.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// Serve images from GridFS
router.get('/image/:id', async (req, res) => {
  try {
    await streamFile('images', req.params.id, req, res);
  } catch (error) {
    if (error.message?.includes('must be a Buffer or string of 12 bytes') ||
        error.message?.includes('Argument passed in must be a string of 12 bytes')) {
      return res.status(400).json({ success: false, message: 'Invalid file ID' });
    }
    console.error('Image stream error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve image' });
  }
});

// Serve videos from GridFS (with Range support for seeking)
router.get('/video/:id', async (req, res) => {
  try {
    await streamFile('videos', req.params.id, req, res);
  } catch (error) {
    if (error.message?.includes('must be a Buffer or string of 12 bytes') ||
        error.message?.includes('Argument passed in must be a string of 12 bytes')) {
      return res.status(400).json({ success: false, message: 'Invalid file ID' });
    }
    console.error('Video stream error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve video' });
  }
});

// Download image (authenticated users only)
router.get('/download/image/:id', authenticate, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'images' });
    const _id = new mongoose.Types.ObjectId(req.params.id);

    const files = await bucket.find({ _id }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const file = files[0];
    const filename = file.filename || 'download.jpg';

    res.set({
      'Content-Type': file.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': file.length,
    });

    bucket.openDownloadStream(_id).pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, message: 'Failed to download file' });
  }
});

module.exports = router;

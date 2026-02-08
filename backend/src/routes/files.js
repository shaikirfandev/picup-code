const router = require('express').Router();
const { streamFile } = require('../config/gridfs');

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

module.exports = router;

// DELETE /api/v1/videos/:id endpoint for deleting a video
const express = require('express');
const fs = require('fs');
const path = require('path');
const Video = require('../models/video.model');
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');
const asyncHandler = require('../utils/asyncHandler');
const config = require('../config');

const router = express.Router();

// ...existing routes...

// DELETE video endpoint
router.delete(
  '/:id',
  auth,
  checkRole(['admin', 'editor']),
  asyncHandler(async (req, res) => {
    const video = await Video.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!video) return res.status(404).json({ message: 'Video not found' });
    if (video.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Remove video file if exists
    if (video.storagePath) {
      try {
        fs.unlinkSync(video.storagePath);
      } catch (err) {
        // File may not exist, ignore error
      }
    }
    await Video.findByIdAndDelete(video._id);
    res.status(200).json({ message: 'Video deleted' });
  })
);

// ...existing routes...

module.exports = router;

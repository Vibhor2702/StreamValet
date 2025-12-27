const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Video = require('../models/video.model');
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');
const asyncHandler = require('../utils/asyncHandler');
const config = require('../config');
const { initStorage, buildUploadPath } = require('../services/storage.service');
const { processVideo, cleanupFile } = require('../services/videoProcessing.service');

initStorage();

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, config.uploadsDir),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${file.originalname}`;
      cb(null, unique);
    },
  }),
  fileFilter: (_req, file, cb) => {
    const allowed = ['video/mp4', 'video/x-matroska'];
    const extAllowed = ['.mp4', '.mkv'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!allowed.includes(file.mimetype) || !extAllowed.includes(ext)) {
      return cb(new Error('Unsupported file type'));
    }
    return cb(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
});

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// List videos for the tenant; admins see all tenant videos, others see their own.
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const query = { tenantId: req.user.tenantId };
    if (req.user.role !== 'admin') {
      query.owner = req.user.id;
    }
    const videos = await Video.find(query).sort({ createdAt: -1 });
    res.json(videos);
  })
);

router.post(
  '/upload',
  auth,
  checkRole(['admin', 'editor']),
  upload.single('video'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (req.body.title && req.body.title.length > 200) {
      cleanupFile(req.file.path);
      return res.status(400).json({ message: 'Title too long (max 200)' });
    }
    if (req.body.description && req.body.description.length > 1000) {
      cleanupFile(req.file.path);
      return res.status(400).json({ message: 'Description too long (max 1000)' });
    }

    const video = new Video({
      tenantId: req.user.tenantId,
      owner: req.user.id,
      title: req.body.title || req.file.originalname,
      description: req.body.description,
      originalFilename: req.file.originalname,
      storagePath: buildUploadPath(req.file.filename),
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    await video.save();

    // Trigger async processing in background
    processVideo(video.id, req.app.get('io'));

    // Return immediately with processing status
    res.status(201).json({ 
      id: video.id, 
      status: 'processing',
      processingStatus: video.processingStatus,
      message: 'Upload complete! Video is being processed...'
    });
  })
);

router.post(
  '/:id/retry',
  auth,
  checkRole(['admin', 'editor']),
  asyncHandler(async (req, res) => {
    const video = await Video.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!video) return res.status(404).json({ message: 'Video not found' });
    if (video.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (video.processingStatus !== Video.PROCESSING_STATUS.FAILED) {
      return res.status(400).json({ message: 'Only FAILED videos can be retried' });
    }

    // reset to PENDING so pipeline can move to PROCESSING cleanly
    video.transitionTo(Video.PROCESSING_STATUS.PENDING, 'Manual retry');
    await video.save();
    processVideo(video.id, req.app.get('io'));
    return res.json({ id: video.id, processingStatus: video.processingStatus });
  })
);

router.get(
  '/stream/:id',
  auth,
  asyncHandler(async (req, res) => {
    const video = await Video.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!video) return res.status(404).json({ message: 'Video not found' });
    if (video.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const filePath = video.storagePath;
    const stat = fs.statSync(filePath);
    const range = req.headers.range;
    if (!range) {
      res.writeHead(200, {
        'Content-Type': video.mimeType,
        'Content-Length': stat.size,
      });
      return fs.createReadStream(filePath).pipe(res);
    }

    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);
    if (Number.isNaN(start)) {
      return res.status(416).send('Invalid range');
    }
    const maxChunk = 1 * 1024 * 1024; // 1MB chunk to keep memory bounded
    let end = endStr ? parseInt(endStr, 10) : Math.min(start + maxChunk - 1, stat.size - 1);
    if (Number.isNaN(end) || end >= stat.size) end = stat.size - 1;
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end, highWaterMark: 64 * 1024 });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': video.mimeType,
    });

    file.pipe(res);
    return undefined;
  })
);


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

// Cleanup handler for orphaned uploads on error (Multer error handling).
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message === 'Unsupported file type') {
    if (_req && _req.file) cleanupFile(path.join(config.uploadsDir, _req.file.filename));
    return res.status(400).json({ message: err.message });
  }
  return res.status(500).json({ message: 'Upload failed' });
});

module.exports = router;

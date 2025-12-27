const express = require('express');
const auth = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const commentService = require('../services/comment.service');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true });
});

router.get(
  '/:videoId',
  auth,
  asyncHandler(async (req, res) => {
    // Support both path param and query param for videoId
    const videoId = req.params.videoId || req.query.videoId;
    
    console.log('💬 [COMMENTS] Fetching comments for video:', videoId);
    
    if (!videoId) {
      return res.status(400).json({ message: 'videoId is required' });
    }
    
    const comments = await commentService.listComments({
      tenantId: req.user.tenantId,
      videoId: videoId,
    });
    
    console.log('✅ [COMMENTS] Found', comments.length, 'comments');
    res.json(comments);
  })
);

// Add route to handle query param style as well
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const videoId = req.query.videoId;
    
    console.log('💬 [COMMENTS] Fetching comments (query param) for video:', videoId);
    
    if (!videoId) {
      return res.status(400).json({ message: 'videoId query parameter is required' });
    }
    
    const comments = await commentService.listComments({
      tenantId: req.user.tenantId,
      videoId: videoId,
    });
    
    console.log('✅ [COMMENTS] Found', comments.length, 'comments');
    res.json(comments);
  })
);

router.post(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { videoId, text, timestamp } = req.body;
    if (!videoId || !text || typeof text !== 'string') {
      return res.status(400).json({ message: 'videoId and text are required' });
    }
    const tsNum = Number(timestamp);
    if (Number.isNaN(tsNum) || tsNum < 0) {
      return res.status(400).json({ message: 'timestamp must be a non-negative number (seconds)' });
    }
    if (text.length > 2000) {
      return res.status(400).json({ message: 'Comment too long (max 2000 chars)' });
    }

    const payload = await commentService.createComment({
      tenantId: req.user.tenantId,
      videoId,
      userId: req.user.id,
      text,
      timestamp: tsNum,
      io: req.app.get('io'),
    });

    res.status(201).json(payload);
  })
);

module.exports = router;

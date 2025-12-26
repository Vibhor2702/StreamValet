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
    const comments = await commentService.listComments({
      tenantId: req.user.tenantId,
      videoId: req.params.videoId,
    });
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

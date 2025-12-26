const Comment = require('../models/comment.model');
const Video = require('../models/video.model');
const User = require('../models/user.model');

async function buildCommentPayload(comment) {
  const base = comment.toObject ? comment.toObject() : comment;
  const user = await User.findById(base.userId).select('name role email');
  return {
    id: base._id?.toString() || base.id,
    videoId: base.videoId,
    userId: base.userId,
    text: base.text,
    timestamp: base.timestamp,
    createdAt: base.createdAt,
    user: user
      ? { id: user.id, name: user.name, role: user.role, email: user.email }
      : { id: base.userId },
  };
}

async function ensureVideoAccess(tenantId, videoId) {
  const video = await Video.findOne({ _id: videoId, tenantId });
  if (!video) {
    const err = new Error('Video not found');
    err.status = 404;
    throw err;
  }
  return video;
}

async function createComment({ tenantId, videoId, userId, text, timestamp, io }) {
  await ensureVideoAccess(tenantId, videoId);

  const comment = await Comment.create({ tenantId, videoId, userId, text, timestamp });
  const payload = await buildCommentPayload(comment);

  if (io) {
    io.emit('NEW_COMMENT', payload);
  }
  return payload;
}

async function listComments({ tenantId, videoId }) {
  await ensureVideoAccess(tenantId, videoId);
  const comments = await Comment.find({ tenantId, videoId })
    .sort({ timestamp: 1, createdAt: 1 })
    .lean();

  const userIds = [...new Set(comments.map((c) => c.userId?.toString()).filter(Boolean))];
  const users = await User.find({ _id: { $in: userIds } }).select('name role email').lean();
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  return comments.map((c) => ({
    id: c._id.toString(),
    videoId: c.videoId,
    userId: c.userId,
    text: c.text,
    timestamp: c.timestamp,
    createdAt: c.createdAt,
    user: userMap.get(c.userId?.toString())
      ? {
          id: c.userId,
          name: userMap.get(c.userId.toString()).name,
          role: userMap.get(c.userId.toString()).role,
          email: userMap.get(c.userId.toString()).email,
        }
      : { id: c.userId },
  }));
}

module.exports = {
  createComment,
  listComments,
};

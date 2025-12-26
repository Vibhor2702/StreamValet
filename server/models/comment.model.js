const mongoose = require('mongoose');

const { Schema, Types } = mongoose;

const CommentSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
      immutable: true,
    },
    videoId: {
      type: Types.ObjectId,
      ref: 'Video',
      required: true,
      index: true,
    },
    userId: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    timestamp: {
      type: Number,
      required: true,
      min: 0,
      description: 'Seconds offset into the video',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

CommentSchema.index({ videoId: 1, timestamp: 1 });
CommentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', CommentSchema);

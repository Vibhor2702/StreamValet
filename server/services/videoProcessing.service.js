const fs = require('fs');
const Video = require('../models/video.model');
const jobQueue = require('./jobQueue.service');
const { processVideoMedia } = require('./ffmpeg.service');
const sensitivityService = require('./sensitivity.service');

function emitProgress(io, payload) {
  if (io) io.emit('VIDEO_PROGRESS', payload);
}

async function processVideo(videoId, io) {
  jobQueue.enqueue(async () => {
    const video = await Video.findById(videoId);
    if (!video) return;

    try {
      video.transitionTo(Video.PROCESSING_STATUS.PROCESSING);
      await video.save();
      emitProgress(io, { videoId: video.id, progress: 20, status: video.processingStatus });

      const media = await processVideoMedia(video.storagePath, video.id);
      video.durationSeconds = media.durationSeconds;
      video.resolution = media.resolution;
      video.thumbnailPath = media.thumbnailPath;
      emitProgress(io, { videoId: video.id, progress: 50, status: video.processingStatus });

      video.transitionTo(Video.PROCESSING_STATUS.ANALYZED);
      emitProgress(io, { videoId: video.id, progress: 70, status: video.processingStatus });

      const sensitivity = sensitivityService.analyze({
        filename: video.originalFilename,
        size: video.size,
        durationSeconds: video.durationSeconds,
      });
      video.sensitivityStatus = sensitivity.status;
      video.sensitivityConfidence = sensitivity.confidence;
      video.sensitivityReason = sensitivity.reason;
      video.sensitivitySegments = sensitivity.sensitivitySegments || [];

      if (sensitivity.status === 'FLAGGED') {
        video.transitionTo(Video.PROCESSING_STATUS.FLAGGED);
      } else {
        video.transitionTo(Video.PROCESSING_STATUS.READY);
      }

      await video.save();
      emitProgress(io, {
        videoId: video.id,
        progress: 100,
        status: video.processingStatus,
        sensitivity: video.sensitivityStatus,
        sensitivitySegments: video.sensitivitySegments,
      });
      if (io)
        io.emit('VIDEO_PROCESSED', {
          videoId: video.id,
          status: video.processingStatus,
          sensitivity: video.sensitivityStatus,
          sensitivitySegments: video.sensitivitySegments,
        });
    } catch (err) {
      try {
        video.transitionTo(Video.PROCESSING_STATUS.FAILED, err.message);
        await video.save();
      } catch (innerErr) {
        // eslint-disable-next-line no-console
        console.error('Failed to set video as FAILED', innerErr);
      }
      emitProgress(io, { videoId: video.id, progress: 0, status: Video.PROCESSING_STATUS.FAILED });
      if (io) io.emit('VIDEO_FAILED', { videoId: video.id, error: err.message });
      // eslint-disable-next-line no-console
      console.error('Processing failed', err);
    }
  });
}

function cleanupFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, () => {});
  }
}

module.exports = {
  processVideo,
  cleanupFile,
};

const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const config = require('../config');
const { buildThumbnailPath } = require('./storage.service');

// Allow overriding ffmpeg binary path via env/config (FFMPEG_PATH)
if (config.ffmpegPath) {
  ffmpeg.setFfmpegPath(config.ffmpegPath);
}

async function getMetadata(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const stream = metadata.streams.find((s) => s.codec_type === 'video');
      resolve({
        durationSeconds: metadata.format.duration,
        resolution: stream
          ? {
              width: stream.width,
              height: stream.height,
            }
          : undefined,
      });
    });
  });
}

async function generateThumbnail(filePath, videoId) {
  const filename = `${videoId}-thumb.jpg`;
  const thumbPath = buildThumbnailPath(filename);

  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .on('error', reject)
      .on('end', () => resolve(thumbPath))
      .screenshots({
        timestamps: ['1'],
        filename,
        folder: path.dirname(thumbPath),
      });
  });
}

async function processVideoMedia(filePath, videoId) {
  const [metadata, thumbnailPath] = await Promise.all([
    getMetadata(filePath),
    generateThumbnail(filePath, videoId),
  ]);
  return { ...metadata, thumbnailPath };
}

module.exports = {
  getMetadata,
  processVideoMedia,
};

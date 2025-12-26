const Video = require('../models/video.model');

function formatWatchTime(seconds) {
  const totalSeconds = Math.max(0, Math.floor(seconds || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatStorage(bytes) {
  const size = bytes || 0;
  if (size >= 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (size >= 1024) {
    return `${(size / 1024).toFixed(0)} KB`;
  }
  return `${size} B`;
}

async function getSmartStats(tenantId) {
  const [agg] = await Video.aggregate([
    { $match: { tenantId } },
    {
      $group: {
        _id: null,
        totalDurationSeconds: { $sum: { $ifNull: ['$durationSeconds', 0] } },
        totalStorageBytes: { $sum: '$size' },
        totalVideos: { $sum: 1 },
        safeCount: {
          $sum: {
            $cond: [{ $eq: ['$sensitivityStatus', Video.SENSITIVITY_STATUS.SAFE] }, 1, 0],
          },
        },
        flaggedCount: {
          $sum: {
            $cond: [{ $eq: ['$sensitivityStatus', Video.SENSITIVITY_STATUS.FLAGGED] }, 1, 0],
          },
        },
      },
    },
  ]);

  const totalVideos = agg?.totalVideos || 0;
  const safeCount = agg?.safeCount || 0;
  const flaggedCount = agg?.flaggedCount || 0;
  const totalDurationSeconds = agg?.totalDurationSeconds || 0;
  const totalStorageBytes = agg?.totalStorageBytes || 0;

  return {
    watchTime: {
      seconds: totalDurationSeconds,
      formatted: formatWatchTime(totalDurationSeconds),
    },
    contentHealth: {
      safeCount,
      flaggedCount,
      totalVideos,
      safePercent: totalVideos ? Math.round((safeCount / totalVideos) * 100) : 0,
      flaggedPercent: totalVideos ? Math.round((flaggedCount / totalVideos) * 100) : 0,
    },
    storage: {
      bytes: totalStorageBytes,
      formatted: formatStorage(totalStorageBytes),
    },
  };
}

module.exports = {
  getSmartStats,
};

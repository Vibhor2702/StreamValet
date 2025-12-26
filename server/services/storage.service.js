const fs = require('fs');
const path = require('path');
const config = require('../config');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function initStorage() {
  ensureDir(config.uploadsDir);
  ensureDir(config.thumbnailsDir);
}

function buildUploadPath(filename) {
  return path.join(config.uploadsDir, filename);
}

function buildThumbnailPath(filename) {
  return path.join(config.thumbnailsDir, filename);
}

module.exports = {
  ensureDir,
  initStorage,
  buildUploadPath,
  buildThumbnailPath,
};

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const baseDir = path.resolve(__dirname, '..');
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
const envCandidates = [
  // Current working directory (e.g., when running from repo root)
  path.resolve(process.cwd(), envFile),
  // Fallback to server directory so prefix/root runs still load env
  path.resolve(baseDir, envFile),
];

const envPath = envCandidates.find((p) => fs.existsSync(p));
if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config({ path: envCandidates[0] });
  // eslint-disable-next-line no-console
  console.warn(`WARNING: ${envFile} not found. Checked ${envCandidates.join(', ')}`);
}

const config = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  uploadsDir: process.env.UPLOADS_DIR || path.resolve(baseDir, 'uploads'),
  thumbnailsDir: process.env.THUMBNAILS_DIR || path.resolve(baseDir, 'thumbnails'),
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
  enableDebug: process.env.DEBUG === 'true',
};

const missing = [];
if (!config.mongoUri) missing.push('MONGO_URI');
if (!config.jwtSecret) missing.push('JWT_SECRET');

if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

module.exports = config;

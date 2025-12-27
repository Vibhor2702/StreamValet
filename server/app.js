const express = require('express');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const videoRoutes = require('./routes/video.routes');
const adminRoutes = require('./routes/admin.routes');
const commentRoutes = require('./routes/comment.routes');
const errorHandler = require('./middlewares/errorHandler');
const { helmetMiddleware, sanitize, globalLimiter, authLimiter, cors, corsOptions } = require('./middlewares/security');
const healthRoutes = require('./routes/health.routes');


const app = express();

// Enable trust proxy for Render (behind reverse proxy)
app.set('trust proxy', 1);
console.log('🔒 Trust proxy enabled for reverse proxy support');

// PHASE 3: Ensure upload directories exist (Render-safe)
const uploadDir = path.resolve(config.uploadsDir);
const thumbnailDir = path.resolve(config.thumbnailsDir);

if (!fs.existsSync(uploadDir)) {
  console.log('📁 Creating missing uploads directory:', uploadDir);
  fs.mkdirSync(uploadDir, { recursive: true });
} else {
  console.log('✅ Uploads directory exists:', uploadDir);
}

if (!fs.existsSync(thumbnailDir)) {
  console.log('📁 Creating missing thumbnails directory:', thumbnailDir);
  fs.mkdirSync(thumbnailDir, { recursive: true });
} else {
  console.log('✅ Thumbnails directory exists:', thumbnailDir);
}

// PHASE 1: Request Logger - Log ALL incoming requests
app.use((req, res, next) => {
  console.log(`[INCOMING] ${new Date().toISOString()} | Method: ${req.method} | URL: ${req.url} | Origin: ${req.headers.origin || 'N/A'}`);
  next();
});

app.disable('x-powered-by');
app.use(helmetMiddleware);
app.use(cors(corsOptions));
app.use(globalLimiter);
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(sanitize);
app.use(morgan('dev'));

// CRITICAL: Static file serving MUST come before routes
app.use('/thumbnails', express.static(path.resolve(config.thumbnailsDir)));
app.use('/uploads', express.static(path.resolve(config.uploadsDir)));

// Health check endpoint for uptime monitoring
app.use('/', healthRoutes);

// PHASE 1: Route Mounting Verification
console.log('🔗 Mounting Video Routes at /api/v1/videos');
console.log('🔗 Mounting Auth Routes at /api/v1/auth');
console.log('🔗 Mounting User Routes at /api/v1/users');
console.log('🔗 Mounting Admin Routes at /api/v1/admin');
console.log('🔗 Mounting Comment Routes at /api/v1/comments');

// Versioned routes (preferred)
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', authLimiter, userRoutes);
app.use('/api/v1/videos', videoRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/comments', commentRoutes);

// Legacy mounts for backward compatibility
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', authLimiter, userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentRoutes);

app.use((req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Not found' });
});

app.use(errorHandler);

module.exports = app;

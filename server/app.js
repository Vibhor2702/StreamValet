const express = require('express');
const morgan = require('morgan');
const path = require('path');
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
// Health check endpoint for uptime monitoring
app.use('/', healthRoutes);

app.disable('x-powered-by');
app.use(helmetMiddleware);
app.use(cors(corsOptions));
app.use(globalLimiter);
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(sanitize);
app.use(morgan('dev'));

app.use('/thumbnails', express.static(path.resolve(config.thumbnailsDir)));
app.use('/uploads', express.static(path.resolve(config.uploadsDir)));

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
  res.status(404).json({ message: 'Not found' });
});

app.use(errorHandler);

module.exports = app;

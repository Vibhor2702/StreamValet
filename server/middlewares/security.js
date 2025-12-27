const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',');

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'PATCH', 'PUT'],
  credentials: true,
};

const helmetMiddleware = helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: false,
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

const sanitize = mongoSanitize({ replaceWith: '_' });

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts. Please try again later.',
});

module.exports = {
  helmetMiddleware,
  sanitize,
  globalLimiter,
  authLimiter,
  corsOptions,
  cors,
};

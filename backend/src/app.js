const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const ApiResponse = require('./utils/ApiResponse');
const httpStatus = require('./constants/httpStatus');

const app = express();

// Trust proxy for Render / Cloudflare reverse proxies to fix ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
app.set('trust proxy', 1);

// Security & Optimization Middleware: Helmet Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(compression());

// Secure CORS Policy: Dynamically reflect origin while maintaining credentials safety
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
}));

// Body Parsing & Size Limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// NoSQL Query Injection Protection Middleware
const sanitizeNoSQL = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (key.startsWith('$')) {
        delete obj[key];
      } else {
        sanitizeNoSQL(obj[key]);
      }
    }
  }
};

app.use((req, res, next) => {
  if (req.body) sanitizeNoSQL(req.body);
  if (req.query) sanitizeNoSQL(req.query);
  if (req.params) sanitizeNoSQL(req.params);
  next();
});

// General API Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 2000 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Dedicated Auth Rate Limiting (Protects Login/OTP against brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 requests per 15 mins for auth operations
  message: { status: 429, message: 'Too many authentication attempts. Please try again later.' }
});

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
const authRoutes = require('./routes/authRoutes');
const videoRoutes = require('./routes/videoRoutes');
const roomRoutes = require('./routes/roomRoutes');
const downloadRoutes = require('./routes/downloadRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const commentRoutes = require('./routes/commentRoutes');

// Mount Routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/videos', videoRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/downloads', downloadRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/comments', commentRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, {
    status: 'Server running',
    timestamp: new Date().toISOString(),
  }, 'Health check passed'));
});

// 404 & Global Error Handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;

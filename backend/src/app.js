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

// Security & Optimization Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Routes
const authRoutes = require('./routes/authRoutes');
const videoRoutes = require('./routes/videoRoutes');
const roomRoutes = require('./routes/roomRoutes');
const downloadRoutes = require('./routes/downloadRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

// Body Parsing & Logging
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount Routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/videos', videoRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/downloads', downloadRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, {
    status: 'Server running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }, 'Health check passed'));
});

// 404 & Global Error Handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;

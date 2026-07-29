const app = require('./src/app');
const connectDB = require('./src/config/db');
const env = require('./src/config/env');
const logger = require('./src/config/logger');
const mongoose = require('mongoose');

// Connect to Database and start server
const startServer = async () => {
  // Ensure DB connects before server starts accepting traffic
  await connectDB();
  
  const server = app.listen(env.PORT, () => {
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });

  // Graceful Shutdown on terminal interrupts
  const gracefulShutdown = () => {
    logger.info('Shutting down server gracefully...');
    server.close(async () => {
      logger.info('Express server closed.');
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed.');
      }
      process.exit(0);
    });
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
  
  return server;
};

const server = startServer();

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.close().then(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

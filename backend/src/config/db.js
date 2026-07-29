const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');
const dns = require('dns');

// Workaround for Node 17+ local DNS resolution issues with MongoDB Atlas SRV records
dns.setDefaultResultOrder('ipv4first');

const connectDB = async () => {
  let retries = 5;
  while (retries) {
    try {
      logger.info('Connecting to MongoDB Atlas...');
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      break; // Successful connection
    } catch (error) {
      logger.error(`Connection Error: ${error.message}`);
      retries -= 1;
      logger.warn(`Retries left: ${retries}`);
      if (retries === 0) {
        logger.error('Maximum retries reached. Exiting gracefully.');
        process.exit(1);
      }
      // Wait for 3 seconds before retrying
      await new Promise(res => setTimeout(res, 3000));
    }
  }
};

// Database Connection Events
mongoose.connection.on('connected', () => {
  logger.info(`MongoDB Connected: ${mongoose.connection.host}`);
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

module.exports = connectDB;

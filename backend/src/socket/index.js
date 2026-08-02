const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // JWT Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      logger.error(`Socket auth error: ${err.message}`);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  const watchPartyHandler = require('./watchParty.socket');
  const chatHandler = require('./chat.socket');
  const videoSyncHandler = require('./videoSync.socket');
  const webrtcHandler = require('./webrtc.socket');
  const commentHandler = require('./comment.socket');

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.user.name})`);

    watchPartyHandler(io, socket);
    chatHandler(io, socket);
    videoSyncHandler(io, socket);
    webrtcHandler(io, socket);
    commentHandler(io, socket);
    
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = initSocket;

const logger = require('../config/logger');

/**
 * Socket handler for real-time video comments
 * @param {Server} io 
 * @param {Socket} socket 
 */
module.exports = function commentSocketHandler(io, socket) {
  // Join video-scoped socket room for real-time comment broadcasts
  socket.on('join-video', ({ videoId }) => {
    if (!videoId) return;
    const roomName = `video_${videoId}`;
    socket.join(roomName);
    logger.info(`Socket ${socket.id} (User: ${socket.user?.name || 'Guest'}) joined room ${roomName}`);
  });

  // Leave video-scoped socket room
  socket.on('leave-video', ({ videoId }) => {
    if (!videoId) return;
    const roomName = `video_${videoId}`;
    socket.leave(roomName);
    logger.info(`Socket ${socket.id} left room ${roomName}`);
  });
};

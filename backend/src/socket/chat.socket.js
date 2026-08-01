const Room = require('../models/Room');
const logger = require('../config/logger');

module.exports = (io, socket) => {
  socket.on('send-message', async ({ roomId, message }) => {
    try {
      if (!message || message.length > 500) return;

      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room) return;

      const userId = socket.user._id.toString();
      const isHost = room.host.toString() === userId;

      if (!isHost && room.meetingPermissions && room.meetingPermissions.chat === false) {
        return;
      }

      io.to(roomId).emit('receive-message', {
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        user: {
          id: socket.user._id,
          name: socket.user.name,
          avatar: socket.user.avatar
        },
        text: message.trim(),
        timestamp: new Date()
      });
    } catch (error) {
      logger.error(`Send message error: ${error.message}`);
    }
  });

  socket.on('typing', ({ roomId }) => {
    try {
      socket.to(roomId).emit('user-typing', { userId: socket.user._id, name: socket.user.name });
    } catch (error) {
      logger.error(`Typing error: ${error.message}`);
    }
  });

  socket.on('stop-typing', ({ roomId }) => {
    try {
      socket.to(roomId).emit('user-stop-typing', { userId: socket.user._id });
    } catch (error) {
      logger.error(`Stop typing error: ${error.message}`);
    }
  });
};

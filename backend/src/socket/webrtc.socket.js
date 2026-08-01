const logger = require('../config/logger');

module.exports = (io, socket) => {
  socket.on('offer', ({ roomId, to, sdp }) => {
    try {
      io.to(to).emit('offer', { from: socket.id, sdp });
    } catch (error) {
      logger.error(`Offer relay error: ${error.message}`);
    }
  });

  socket.on('answer', ({ roomId, to, sdp }) => {
    try {
      io.to(to).emit('answer', { from: socket.id, sdp });
    } catch (error) {
      logger.error(`Answer relay error: ${error.message}`);
    }
  });

  socket.on('ice-candidate', ({ roomId, to, candidate }) => {
    try {
      io.to(to).emit('ice-candidate', { from: socket.id, candidate });
    } catch (error) {
      logger.error(`ICE candidate relay error: ${error.message}`);
    }
  });
};

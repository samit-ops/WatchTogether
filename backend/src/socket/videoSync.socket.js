const Room = require('../models/Room');
const logger = require('../config/logger');

const hasPlaybackPermission = (room, userId) => {
  const participant = room.participants.find(p => p.user.toString() === userId.toString());
  if (!participant) return false;

  if (room.playbackPermission === 'everyone') return true;
  if (room.playbackPermission === 'moderator' && (participant.role === 'host' || participant.role === 'moderator')) return true;
  if (room.playbackPermission === 'host' && participant.role === 'host') return true;

  return false;
};

module.exports = (io, socket) => {
  socket.on('play', async ({ roomId, currentTime }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room || !hasPlaybackPermission(room, socket.user._id)) return;

      room.playbackState = {
        isPlaying: true,
        currentTime: currentTime,
        playbackRate: room.playbackState?.playbackRate || 1,
        updatedAt: new Date()
      };
      await room.save();

      socket.to(roomId).emit('play', { currentTime, updatedBy: socket.user._id });
    } catch (error) {
      logger.error(`Play error: ${error.message}`);
    }
  });

  socket.on('pause', async ({ roomId, currentTime }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room || !hasPlaybackPermission(room, socket.user._id)) return;

      room.playbackState = {
        isPlaying: false,
        currentTime: currentTime,
        playbackRate: room.playbackState?.playbackRate || 1,
        updatedAt: new Date()
      };
      await room.save();

      socket.to(roomId).emit('pause', { currentTime, updatedBy: socket.user._id });
    } catch (error) {
      logger.error(`Pause error: ${error.message}`);
    }
  });

  socket.on('seek', async ({ roomId, currentTime }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room || !hasPlaybackPermission(room, socket.user._id)) return;

      room.playbackState = {
        ...room.playbackState,
        currentTime: currentTime,
        updatedAt: new Date()
      };
      await room.save();

      socket.to(roomId).emit('seek', { currentTime, updatedBy: socket.user._id });
    } catch (error) {
      logger.error(`Seek error: ${error.message}`);
    }
  });

  socket.on('playback-rate', async ({ roomId, rate }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room || !hasPlaybackPermission(room, socket.user._id)) return;

      room.playbackState = {
        ...room.playbackState,
        playbackRate: rate,
        updatedAt: new Date()
      };
      await room.save();

      socket.to(roomId).emit('playback-rate', { rate, updatedBy: socket.user._id });
    } catch (error) {
      logger.error(`Playback rate error: ${error.message}`);
    }
  });

  socket.on('request-sync', async ({ roomId }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room) return;

      socket.emit('sync-time', room.playbackState);
    } catch (error) {
      logger.error(`Request sync error: ${error.message}`);
    }
  });

  socket.on('video-ended', async ({ roomId }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room || !hasPlaybackPermission(room, socket.user._id)) return;

      room.playbackState = {
        ...room.playbackState,
        isPlaying: false,
        updatedAt: new Date()
      };
      await room.save();

      io.to(roomId).emit('video-ended');
    } catch (error) {
      logger.error(`Video ended error: ${error.message}`);
    }
  });
};

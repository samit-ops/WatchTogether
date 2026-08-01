const Room = require('../models/Room');
const logger = require('../config/logger');

const broadcastParticipants = async (io, room) => {
  try {
    const unique = [];
    const seen = new Set();
    for (const p of room.participants) {
      const uId = (p.user?._id || p.user || '').toString();
      if (uId && !seen.has(uId)) {
        seen.add(uId);
        unique.push(p);
      }
    }
    room.participants = unique;

    await room.populate('participants.user', 'name avatar');
    await room.populate('host', 'name avatar');

    io.to(room.roomId).emit('participants-updated', {
      participants: room.participants,
      host: room.host,
      playbackPermission: room.playbackPermission,
      meetingPermissions: room.meetingPermissions,
      isLocked: room.isLocked,
      isRecording: room.isRecording,
      type: room.type
    });
  } catch (error) {
    logger.error(`Error broadcasting participants: ${error.message}`);
  }
};

const handleParticipantLeave = async (io, socket, roomId) => {
  try {
    const room = await Room.findOne({ roomId, status: 'active' });
    if (!room) return;

    const participantIndex = room.participants.findIndex(p => 
      p.socketId === socket.id || (p.user?._id || p.user).toString() === (socket.user?._id || socket.user?.id || '').toString()
    );
    if (participantIndex !== -1) {
      const participant = room.participants[participantIndex];
      const wasHost = participant.role === 'host';
      const userName = socket.user?.name || 'A user';
      
      room.participants.splice(participantIndex, 1);

      if (room.participants.length === 0) {
        room.status = 'ended';
      } else if (wasHost) {
        room.participants.sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));
        room.participants[0].role = 'host';
        room.host = room.participants[0].user;
        io.to(roomId).emit('host-changed', { newHostId: room.host });
      }

      await room.save();
      io.to(roomId).emit('receive-message', {
        id: Date.now().toString(),
        user: { name: 'System' },
        text: `${userName} left the Watch Party`,
        timestamp: new Date()
      });
      await broadcastParticipants(io, room);
    }
  } catch (error) {
    logger.error(`Error handling participant leave: ${error.message}`);
  }
};

module.exports = (io, socket) => {
  socket.on('join-room', async ({ roomId }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room) {
        return socket.emit('error', { message: 'Room not found or inactive' });
      }

      const userId = socket.user._id.toString();
      const isHost = room.host.toString() === userId;

      if (room.isLocked && !isHost) {
        return socket.emit('error', { message: 'Room is locked' });
      }

      socket.join(roomId);
      socket.currentRoom = roomId;

      // Remove stale entries safely whether p.user is ObjectId or populated object
      room.participants = room.participants.filter(p => {
        const pUserId = (p.user?._id || p.user).toString();
        return pUserId !== userId;
      });

      room.participants.push({
        user: socket.user._id,
        socketId: socket.id,
        role: isHost ? 'host' : 'guest',
        joinedAt: new Date(),
        isMuted: true,
        isCameraOff: true,
        isScreenSharing: false
      });

      await room.save();

      io.to(roomId).emit('receive-message', {
        id: Date.now().toString(),
        user: { name: 'System' },
        text: `${socket.user.name} joined the Watch Party`,
        timestamp: new Date()
      });

      await broadcastParticipants(io, room);

      if (room.type === 'video') {
        socket.emit('sync-time', room.playbackState);
      }
    } catch (error) {
      logger.error(`Join room error: ${error.message}`);
    }
  });

  socket.on('leave-room', async ({ roomId }) => {
    try {
      socket.leave(roomId);
      socket.currentRoom = null;
      await handleParticipantLeave(io, socket, roomId);
    } catch (error) {
      logger.error(`Leave room error: ${error.message}`);
    }
  });

  socket.on('kick-participant', async ({ roomId, targetUserId }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room || room.host.toString() !== socket.user._id.toString()) return;

      const targetIndex = room.participants.findIndex(p => p.user.toString() === targetUserId);
      if (targetIndex !== -1) {
        const targetSocketId = room.participants[targetIndex].socketId;
        io.to(targetSocketId).emit('kicked');
        room.participants.splice(targetIndex, 1);
        await room.save();
        await broadcastParticipants(io, room);
      }
    } catch (error) {
      logger.error(`Kick participant error: ${error.message}`);
    }
  });

  socket.on('promote-participant', async ({ roomId, targetUserId }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room || room.host.toString() !== socket.user._id.toString()) return;

      const target = room.participants.find(p => p.user.toString() === targetUserId);
      if (target) {
        target.role = 'moderator';
        await room.save();
        await broadcastParticipants(io, room);
      }
    } catch (error) {
      logger.error(`Promote participant error: ${error.message}`);
    }
  });

  socket.on('demote-participant', async ({ roomId, targetUserId }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room || room.host.toString() !== socket.user._id.toString()) return;

      const target = room.participants.find(p => p.user.toString() === targetUserId);
      if (target) {
        target.role = 'guest';
        await room.save();
        await broadcastParticipants(io, room);
      }
    } catch (error) {
      logger.error(`Demote participant error: ${error.message}`);
    }
  });

  socket.on('transfer-host', async ({ roomId, targetUserId }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room || room.host.toString() !== socket.user._id.toString()) return;

      const oldHost = room.participants.find(p => p.user.toString() === room.host.toString());
      const newHost = room.participants.find(p => p.user.toString() === targetUserId);

      if (oldHost && newHost) {
        room.host = targetUserId;
        oldHost.role = 'guest';
        newHost.role = 'host';
        await room.save();
        await broadcastParticipants(io, room);
        io.to(roomId).emit('host-changed', { newHostId: targetUserId });
      }
    } catch (error) {
      logger.error(`Transfer host error: ${error.message}`);
    }
  });

  socket.on('lock-room', async ({ roomId }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room || room.host.toString() !== socket.user._id.toString()) return;

      room.isLocked = true;
      await room.save();
      await broadcastParticipants(io, room);
      io.to(roomId).emit('room-locked');
    } catch (error) {
      logger.error(`Lock room error: ${error.message}`);
    }
  });

  socket.on('unlock-room', async ({ roomId }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room || room.host.toString() !== socket.user._id.toString()) return;

      room.isLocked = false;
      await room.save();
      await broadcastParticipants(io, room);
    } catch (error) {
      logger.error(`Unlock room error: ${error.message}`);
    }
  });

  socket.on('end-room', async ({ roomId }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room || room.host.toString() !== socket.user._id.toString()) return;

      room.status = 'ended';
      await room.save();
      io.to(roomId).emit('room-ended');
    } catch (error) {
      logger.error(`End room error: ${error.message}`);
    }
  });

  socket.on('update-permissions', async ({ roomId, playbackPermission, meetingPermissions }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room || room.host.toString() !== socket.user._id.toString()) return;

      if (playbackPermission) room.playbackPermission = playbackPermission;
      if (meetingPermissions) {
        room.meetingPermissions = { ...room.meetingPermissions, ...meetingPermissions };
      }
      await room.save();
      await broadcastParticipants(io, room);
    } catch (error) {
      logger.error(`Update permissions error: ${error.message}`);
    }
  });

  socket.on('toggle-mic', async ({ roomId, isMuted }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room) return;
      const participant = room.participants.find(p => p.socketId === socket.id);
      if (participant) {
        participant.isMuted = isMuted;
        await room.save();
        await broadcastParticipants(io, room);
      }
    } catch (error) {
      logger.error(`Toggle mic error: ${error.message}`);
    }
  });

  socket.on('toggle-camera', async ({ roomId, isCameraOff }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room) return;
      const participant = room.participants.find(p => p.socketId === socket.id);
      if (participant) {
        participant.isCameraOff = isCameraOff;
        await room.save();
        await broadcastParticipants(io, room);
      }
    } catch (error) {
      logger.error(`Toggle camera error: ${error.message}`);
    }
  });

  socket.on('screen-share-start', async ({ roomId }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room) return;
      const participant = room.participants.find(p => p.socketId === socket.id);
      if (participant) {
        participant.isScreenSharing = true;
        await room.save();
        await broadcastParticipants(io, room);
        io.to(roomId).emit('screen-share-started', { socketId: socket.id, userId: socket.user._id });
      }
    } catch (error) {
      logger.error(`Screen share start error: ${error.message}`);
    }
  });

  socket.on('screen-share-stop', async ({ roomId }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room) return;
      const participant = room.participants.find(p => p.socketId === socket.id);
      if (participant) {
        participant.isScreenSharing = false;
        await room.save();
        await broadcastParticipants(io, room);
        io.to(roomId).emit('screen-share-stopped', { socketId: socket.id });
      }
    } catch (error) {
      logger.error(`Screen share stop error: ${error.message}`);
    }
  });

  socket.on('recording-start', async ({ roomId }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room || room.host.toString() !== socket.user._id.toString()) return;

      room.isRecording = true;
      await room.save();
      await broadcastParticipants(io, room);
      io.to(roomId).emit('recording-started');
    } catch (error) {
      logger.error(`Recording start error: ${error.message}`);
    }
  });

  socket.on('recording-stop', async ({ roomId }) => {
    try {
      const room = await Room.findOne({ roomId, status: 'active' });
      if (!room || room.host.toString() !== socket.user._id.toString()) return;

      room.isRecording = false;
      await room.save();
      await broadcastParticipants(io, room);
      io.to(roomId).emit('recording-stopped');
    } catch (error) {
      logger.error(`Recording stop error: ${error.message}`);
    }
  });

  socket.on('disconnect', async () => {
    try {
      if (socket.currentRoom) {
        await handleParticipantLeave(io, socket, socket.currentRoom);
      }
    } catch (error) {
      logger.error(`Disconnect handling error: ${error.message}`);
    }
  });
};

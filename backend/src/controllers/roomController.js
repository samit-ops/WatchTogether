const crypto = require('crypto');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const httpStatus = require('../constants/httpStatus');
const Room = require('../models/Room');
const Video = require('../models/Video');

exports.createRoom = asyncHandler(async (req, res) => {
  const { videoId, type } = req.body;
  const roomType = type || 'video';

  if (roomType === 'video' && !videoId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Video ID is required for video rooms');
  }

  const roomId = crypto.randomBytes(4).toString('hex');
  const roomData = {
    roomId,
    host: req.user._id || req.user.id,
    type: roomType,
    participants: []
  };

  if (roomType === 'video') {
    roomData.video = videoId;
  }

  const room = await Room.create(roomData);
  const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
  const inviteUrl = `${frontendUrl}/watch-party/${roomId}`;

  res.status(httpStatus.CREATED).json(
    new ApiResponse(httpStatus.CREATED, { room, inviteUrl }, 'Room created successfully')
  );
});

exports.getRoom = asyncHandler(async (req, res) => {
  const room = await Room.findOne({ roomId: req.params.roomId, status: 'active' })
    .populate('host', 'name avatar')
    .populate('video');

  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found or ended');
  }

  res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, { room }, 'Room fetched successfully')
  );
});

exports.leaveRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.body;
  const userId = req.user._id || req.user.id;

  const room = await Room.findOne({ roomId, status: 'active' });
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }

  const participantIndex = room.participants.findIndex(p => p.user.toString() === userId.toString());
  if (participantIndex === -1) {
    return res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, {}, 'Left room successfully'));
  }

  const wasHost = room.participants[participantIndex].role === 'host';
  room.participants.splice(participantIndex, 1);

  if (wasHost && room.participants.length > 0) {
    room.participants.sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));
    room.participants[0].role = 'host';
    room.host = room.participants[0].user;
  }

  await room.save();

  res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, {}, 'Left room successfully'));
});

exports.deleteRoom = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const room = await Room.findOne({ roomId: req.params.roomId });

  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }

  if (room.host.toString() !== userId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only host can delete the room');
  }

  room.status = 'ended';
  await room.save();

  res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, {}, 'Room ended successfully'));
});

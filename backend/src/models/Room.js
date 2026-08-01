const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    socketId: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['host', 'moderator', 'guest'],
      default: 'guest',
    },
    isMuted: {
      type: Boolean,
      default: true,
    },
    isCameraOff: {
      type: Boolean,
      default: true,
    },
    isScreenSharing: {
      type: Boolean,
      default: false,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    host: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['video', 'live'],
      required: true,
      default: 'video',
    },
    video: {
      type: mongoose.Schema.ObjectId,
      ref: 'Video',
      required: function () {
        return this.type === 'video';
      },
    },
    participants: [participantSchema],
    status: {
      type: String,
      enum: ['active', 'ended'],
      default: 'active',
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    isRecording: {
      type: Boolean,
      default: false,
    },
    playbackPermission: {
      type: String,
      enum: ['host', 'moderator', 'everyone'],
      default: 'host',
    },
    meetingPermissions: {
      camera: { type: Boolean, default: true },
      mic: { type: Boolean, default: true },
      screenShare: { type: Boolean, default: true },
      chat: { type: Boolean, default: true },
    },
    playbackState: {
      isPlaying: { type: Boolean, default: false },
      currentTime: { type: Number, default: 0 },
      playbackRate: { type: Number, default: 1 },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
  }
);

// Auto-expire rooms after 24 hours of inactivity
roomSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Room', roomSchema);

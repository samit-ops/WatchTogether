const mongoose = require('mongoose');

const downloadHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    video: {
      type: mongoose.Schema.ObjectId,
      ref: 'Video',
      required: true,
    },
    planUsed: {
      type: String,
      enum: ['Free', 'Bronze', 'Silver', 'Gold'],
      required: true,
    },
    videoSource: {
      type: String,
      enum: ['platform', 'user'],
      default: 'user',
    },
    fileSize: {
      type: String,
      default: 'Standard MP4',
    },
    downloadDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DownloadHistory', downloadHistorySchema);

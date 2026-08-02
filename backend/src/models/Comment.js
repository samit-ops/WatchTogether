const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.ObjectId,
      ref: 'Video',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Please enter a comment'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      trim: true,
    },
    parentComment: {
      type: mongoose.Schema.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    likes: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    dislikes: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    reports: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    isReported: {
      type: Boolean,
      default: false,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    showLocation: {
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying comments by video and parentComment efficiently
commentSchema.index({ video: 1, parentComment: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);

const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a video title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    thumbnail: {
      type: String,
      required: [true, 'Please provide a thumbnail URL'],
    },
    thumbnailUrl: {
      type: String,
    },
    thumbnailPublicId: {
      type: String,
    },
    videoUrl: {
      type: String,
      required: [true, 'Please provide a video URL'],
    },
    videoPublicId: {
      type: String,
    },
    duration: {
      type: Number, // duration in seconds
      default: 0,
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: ['Movies', 'TV Shows', 'Documentaries', 'Anime', 'Sports', 'Other'],
    },
    source: {
      type: String,
      enum: ['platform', 'user', 'watchparty'],
      default: 'platform',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    uploadedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    dislikes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    dislikedBy: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Video', videoSchema);

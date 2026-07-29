const Video = require('../models/Video');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const httpStatus = require('../constants/httpStatus');
const { uploadToCloudinary, isConfigured, deleteFromCloudinary } = require('../services/cloudinary.service');

// @desc    Get all videos
// @route   GET /api/v1/videos
// @access  Public
exports.getVideos = asyncHandler(async (req, res, next) => {
  const videos = await Video.find()
    .populate('uploadedBy', 'name avatar')
    .sort('-createdAt');

  res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, { videos })
  );
});

// @desc    Get single video
// @route   GET /api/v1/videos/:id
// @access  Public
exports.getVideo = asyncHandler(async (req, res, next) => {
  const video = await Video.findById(req.params.id).populate('uploadedBy', 'name avatar');
  
  if (!video) {
    return next(new ApiError(httpStatus.NOT_FOUND, 'Video not found'));
  }

  res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, { video })
  );
});

// @desc    Increment video views
// @route   PUT /api/v1/videos/:id/view
// @access  Public
exports.incrementViews = asyncHandler(async (req, res, next) => {
  const video = await Video.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true, runValidators: false }
  );

  if (!video) {
    return next(new ApiError(httpStatus.NOT_FOUND, 'Video not found'));
  }

  res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, {}, 'View recorded')
  );
});

// @desc    Upload video
// @route   POST /api/v1/videos/upload
// @access  Private
exports.uploadVideo = asyncHandler(async (req, res, next) => {
  if (!isConfigured()) {
    return next(new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'Video uploads are temporarily unavailable (Cloudinary missing)'));
  }

  if (!req.files || !req.files.video || !req.files.thumbnail) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Please upload both a video and a thumbnail'));
  }

  const { title, description, category, duration, tags } = req.body;

  if (!title || !description || !category) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Please provide title, description, and category'));
  }

  // Upload thumbnail
  const thumbResult = await uploadToCloudinary(req.files.thumbnail[0].buffer, 'image');
  
  // Upload video
  const videoResult = await uploadToCloudinary(req.files.video[0].buffer, 'video');

  const video = await Video.create({
    title,
    description,
    category,
    duration: duration || videoResult.duration || 0,
    tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
    thumbnail: thumbResult.secure_url,
    thumbnailUrl: thumbResult.secure_url,
    thumbnailPublicId: thumbResult.public_id,
    videoUrl: videoResult.secure_url,
    videoPublicId: videoResult.public_id,
    uploadedBy: req.user.id
  });

  res.status(httpStatus.CREATED).json(
    new ApiResponse(httpStatus.CREATED, { video }, 'Video uploaded successfully')
  );
});

// @desc    Update video
// @route   PUT /api/v1/videos/:id
// @access  Private
exports.updateVideo = asyncHandler(async (req, res, next) => {
  let video = await Video.findById(req.params.id);

  if (!video) {
    return next(new ApiError(httpStatus.NOT_FOUND, 'Video not found'));
  }

  // Ensure user owns video
  if (video.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ApiError(httpStatus.FORBIDDEN, 'Not authorized to update this video'));
  }

  const { title, description, category, tags } = req.body;
  const updateData = {
    title,
    description,
    category,
    tags: tags ? (typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags) : undefined,
  };

  // If a new video is uploaded
  if (req.files && req.files.video) {
    if (!isConfigured()) {
      return next(new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'Cloudinary missing, cannot upload new video'));
    }
    // Delete old video from Cloudinary
    if (video.videoPublicId) {
      await deleteFromCloudinary(video.videoPublicId, 'video');
    }
    const videoResult = await uploadToCloudinary(req.files.video[0].buffer, 'video');
    updateData.videoUrl = videoResult.secure_url;
    updateData.videoPublicId = videoResult.public_id;
    updateData.duration = videoResult.duration || video.duration;
  }

  // If a new thumbnail is uploaded
  if (req.files && req.files.thumbnail) {
    if (!isConfigured()) {
      return next(new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'Cloudinary missing, cannot upload new thumbnail'));
    }
    // Delete old thumbnail from Cloudinary
    if (video.thumbnailPublicId) {
      await deleteFromCloudinary(video.thumbnailPublicId, 'image');
    }
    const thumbResult = await uploadToCloudinary(req.files.thumbnail[0].buffer, 'image');
    updateData.thumbnail = thumbResult.secure_url;
    updateData.thumbnailUrl = thumbResult.secure_url;
    updateData.thumbnailPublicId = thumbResult.public_id;
  }

  // Remove undefined fields
  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

  video = await Video.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, { video }, 'Video updated')
  );
});

// @desc    Delete video
// @route   DELETE /api/v1/videos/:id
// @access  Private
exports.deleteVideo = asyncHandler(async (req, res, next) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    return next(new ApiError(httpStatus.NOT_FOUND, 'Video not found'));
  }

  // Ensure user owns video
  if (video.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ApiError(httpStatus.FORBIDDEN, 'Not authorized to delete this video'));
  }

  // Delete from Cloudinary
  if (isConfigured()) {
    if (video.videoPublicId) {
      await deleteFromCloudinary(video.videoPublicId, 'video');
    }
    if (video.thumbnailPublicId) {
      await deleteFromCloudinary(video.thumbnailPublicId, 'image');
    }
  }

  await video.deleteOne();

  res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, {}, 'Video removed')
  );
});

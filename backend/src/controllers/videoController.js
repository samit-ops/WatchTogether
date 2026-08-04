const Video = require('../models/Video');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const httpStatus = require('../constants/httpStatus');
const { uploadToCloudinary, isConfigured, deleteFromCloudinary } = require('../services/cloudinary.service');

// @desc    Get all platform videos (home feed)
// @route   GET /api/v1/videos
// @access  Public
exports.getVideos = asyncHandler(async (req, res, next) => {
  const query = { source: 'platform', isPublic: true };
  if (req.query.category && req.query.category !== 'All') {
    query.category = req.query.category;
  }
  if (req.query.search && req.query.search.trim()) {
    const searchRegex = new RegExp(req.query.search.trim(), 'i');
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { tags: searchRegex }
    ];
  }
  const videos = await Video.find(query)
    .populate('uploadedBy', 'name avatar')
    .sort('-createdAt');

  res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, { videos })
  );
});

// @desc    Get videos uploaded by current logged-in user
// @route   GET /api/v1/videos/me
// @access  Private
exports.getMyVideos = asyncHandler(async (req, res, next) => {
  const videos = await Video.find({ uploadedBy: req.user._id })
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

  const doc = video.toObject();
  const userId = req.user ? req.user._id.toString() : null;
  doc.isLiked = userId ? (video.likedBy || []).some(id => id.toString() === userId) : false;
  doc.isDisliked = userId ? (video.dislikedBy || []).some(id => id.toString() === userId) : false;

  res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, { video: doc })
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
    new ApiResponse(httpStatus.OK, { views: video.views }, 'View recorded')
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

  const { title, description, category, duration, tags, source = 'platform' } = req.body;

  if (!title || !description || !category) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Please provide title, description, and category'));
  }

  const validSource = source === 'watchparty' ? 'watchparty' : 'platform';

  // Upload thumbnail
  const thumbResult = await uploadToCloudinary(req.files.thumbnail[0].buffer, 'image');
  
  // Upload video
  const videoResult = await uploadToCloudinary(req.files.video[0].buffer, 'video');

  const video = await Video.create({
    title,
    description,
    category,
    source: validSource,
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

// @desc    Get platform videos (admin uploaded)
// @route   GET /api/v1/videos/platform
// @access  Public
exports.getPlatformVideos = asyncHandler(async (req, res, next) => {
  const videos = await Video.find({ source: 'platform' })
    .populate('uploadedBy', 'name avatar')
    .sort('-createdAt');

  res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, { videos })
  );
});

// @desc    Toggle Like on video
// @route   POST /api/v1/videos/:id/like
// @access  Private
exports.likeVideo = asyncHandler(async (req, res, next) => {
  const video = await Video.findById(req.params.id);
  if (!video) {
    return next(new ApiError(httpStatus.NOT_FOUND, 'Video not found'));
  }

  const userId = req.user._id.toString();
  const likedIndex = video.likedBy.findIndex(id => id.toString() === userId);
  const dislikedIndex = video.dislikedBy.findIndex(id => id.toString() === userId);

  if (likedIndex > -1) {
    video.likedBy.splice(likedIndex, 1);
  } else {
    video.likedBy.push(req.user._id);
    if (dislikedIndex > -1) {
      video.dislikedBy.splice(dislikedIndex, 1);
    }
  }

  video.likes = video.likedBy.length;
  video.dislikes = video.dislikedBy.length;
  await video.save();

  const isLiked = video.likedBy.some(id => id.toString() === userId);
  const isDisliked = video.dislikedBy.some(id => id.toString() === userId);

  res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, {
      likes: video.likes,
      dislikes: video.dislikes,
      isLiked,
      isDisliked
    }, 'Video reaction updated')
  );
});

// @desc    Toggle Dislike on video
// @route   POST /api/v1/videos/:id/dislike
// @access  Private
exports.dislikeVideo = asyncHandler(async (req, res, next) => {
  const video = await Video.findById(req.params.id);
  if (!video) {
    return next(new ApiError(httpStatus.NOT_FOUND, 'Video not found'));
  }

  const userId = req.user._id.toString();
  const likedIndex = video.likedBy.findIndex(id => id.toString() === userId);
  const dislikedIndex = video.dislikedBy.findIndex(id => id.toString() === userId);

  if (dislikedIndex > -1) {
    video.dislikedBy.splice(dislikedIndex, 1);
  } else {
    video.dislikedBy.push(req.user._id);
    if (likedIndex > -1) {
      video.likedBy.splice(likedIndex, 1);
    }
  }

  video.likes = video.likedBy.length;
  video.dislikes = video.dislikedBy.length;
  await video.save();

  const isLiked = video.likedBy.some(id => id.toString() === userId);
  const isDisliked = video.dislikedBy.some(id => id.toString() === userId);

  res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, {
      likes: video.likes,
      dislikes: video.dislikes,
      isLiked,
      isDisliked
    }, 'Video reaction updated')
  );
});



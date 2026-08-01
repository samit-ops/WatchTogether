const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const httpStatus = require('../constants/httpStatus');
const DownloadHistory = require('../models/DownloadHistory');
const Video = require('../models/Video');
const { PLAN_LIMITS } = require('../config/planLimits');

// @desc    Initiate and record a video download
// @route   POST /api/v1/downloads/:videoId
// @access  Private
exports.processDownload = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const user = req.user;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Video not found');
  }

  const userPlan = user.subscription || 'Free';
  const limit = PLAN_LIMITS[userPlan] !== undefined ? PLAN_LIMITS[userPlan] : 1;

  // Calculate start of current day (UTC midnight)
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const nextReset = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000).toISOString();

  // Count user downloads today
  const usedToday = await DownloadHistory.countDocuments({
    user: user._id,
    downloadDate: { $gte: startOfDay },
  });

  if (usedToday >= limit) {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      message: `Daily download limit reached (${usedToday}/${limit}) for your ${userPlan} plan. Upgrade to a higher plan for more downloads!`,
      plan: userPlan,
      usedToday,
      limit,
      remaining: 0,
      nextReset,
    });
  }

  // Record download history entry
  const downloadRecord = await DownloadHistory.create({
    user: user._id,
    video: video._id,
    planUsed: userPlan,
    videoSource: video.source || 'user',
    fileSize: `${Math.floor((video.duration || 300) * 0.25 + 10)} MB`,
    downloadDate: new Date(),
  });

  const remaining = Math.max(0, limit - (usedToday + 1));

  return res.status(httpStatus.OK).json(
    new ApiResponse(
      httpStatus.OK,
      {
        download: downloadRecord,
        video: {
          id: video._id,
          title: video.title,
          videoUrl: video.videoUrl,
          thumbnail: video.thumbnail || video.thumbnailUrl,
          category: video.category,
          duration: video.duration,
        },
        plan: userPlan,
        usedToday: usedToday + 1,
        limit,
        remaining,
        nextReset,
      },
      'Download initiated successfully'
    )
  );
});

// @desc    Get current user's download history
// @route   GET /api/v1/downloads/my
// @access  Private
exports.getUserDownloads = asyncHandler(async (req, res) => {
  const downloads = await DownloadHistory.find({ user: req.user._id })
    .populate('video')
    .sort({ downloadDate: -1 });

  return res
    .status(httpStatus.OK)
    .json(new ApiResponse(httpStatus.OK, downloads, 'Downloaded videos retrieved successfully'));
});

// @desc    Get user's daily download status and remaining quota
// @route   GET /api/v1/downloads/status
// @access  Private
exports.getDownloadStatus = asyncHandler(async (req, res) => {
  const user = req.user;
  const userPlan = user.subscription || 'Free';
  const limit = PLAN_LIMITS[userPlan] !== undefined ? PLAN_LIMITS[userPlan] : 1;

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const nextReset = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const usedToday = await DownloadHistory.countDocuments({
    user: user._id,
    downloadDate: { $gte: startOfDay },
  });

  const remaining = Math.max(0, limit - usedToday);

  return res.status(httpStatus.OK).json({
    success: true,
    plan: userPlan,
    usedToday,
    limit,
    remaining,
    nextReset,
  });
});

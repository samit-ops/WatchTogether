const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const httpStatus = require('../constants/httpStatus');
const DownloadHistory = require('../models/DownloadHistory');
const Video = require('../models/Video');
const User = require('../models/User');
const SUBSCRIPTION_PLANS = require('../config/subscriptionPlans');

const getPlanLimit = (planName) => {
  const plan = SUBSCRIPTION_PLANS[planName] || SUBSCRIPTION_PLANS.Free;
  return plan.downloadLimit;
};

// @desc    Initiate and record a video download
// @route   POST /api/v1/downloads/:videoId
// @access  Private
exports.processDownload = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userDoc = await User.findById(req.user._id);

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Video not found');
  }

  const userPlan = userDoc?.subscription || req.user.subscription || 'Free';
  const dailyLimit = getPlanLimit(userPlan);

  // Check today's download count (UTC midnight)
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const nextReset = new Date(startOfDay);
  nextReset.setUTCDate(nextReset.getUTCDate() + 1);

  const usedToday = await DownloadHistory.countDocuments({
    user: req.user._id,
    downloadDate: { $gte: startOfDay }
  });

  if (usedToday >= dailyLimit) {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      limitReached: true,
      message: `Daily download limit reached (${usedToday}/${dailyLimit}) for your ${userPlan} plan. Upgrade your plan for more downloads.`,
      plan: userPlan,
      usedToday,
      limit: dailyLimit,
      remaining: 0,
      nextReset
    });
  }

  // Record download history entry
  const downloadRecord = await DownloadHistory.create({
    user: req.user._id,
    video: video._id,
    planUsed: userPlan,
    videoSource: video.source || 'user',
    fileSize: `${Math.floor((video.duration || 300) * 0.25 + 10)} MB`,
    downloadDate: new Date(),
  });

  const remaining = Math.max(0, dailyLimit - (usedToday + 1));

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
        limit: dailyLimit,
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
  const userDoc = await User.findById(req.user._id);
  const userPlan = userDoc?.subscription || req.user.subscription || 'Free';
  const limit = getPlanLimit(userPlan);

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const nextReset = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const usedToday = await DownloadHistory.countDocuments({
    user: req.user._id,
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

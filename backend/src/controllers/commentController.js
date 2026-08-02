const Comment = require('../models/Comment');
const Video = require('../models/Video');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const httpStatus = require('../constants/httpStatus');
const { validateCommentContent } = require('../utils/moderationFilter');
const { buildCommentTree } = require('../utils/commentTree');

// Helper to broadcast socket events safely
const emitSocketEvent = (req, roomId, event, payload) => {
  try {
    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit(event, payload);
    }
  } catch (err) {
    console.error(`Socket broadcast error for event ${event}:`, err.message);
  }
};

// Helper for recursive comment deletion IDs
const getDescendantCommentIds = async (commentId) => {
  let ids = [commentId.toString()];
  const children = await Comment.find({ parentComment: commentId }).select('_id');
  for (const child of children) {
    const childDescendants = await getDescendantCommentIds(child._id);
    ids = ids.concat(childDescendants);
  }
  return ids;
};

// @desc    Get comments for a platform video (Paginated Top-level with Nested Replies)
// @route   GET /api/v1/comments/video/:videoId
// @access  Public
exports.getCommentsByVideo = asyncHandler(async (req, res, next) => {
  const { videoId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  // 1. Verify Video Exists & is a Platform Video
  const video = await Video.findById(videoId);
  if (!video) {
    return next(new ApiError(httpStatus.NOT_FOUND, 'Video not found'));
  }

  if (video.source && video.source !== 'platform') {
    return next(new ApiError(httpStatus.FORBIDDEN, 'Comments are only supported for platform videos.'));
  }

  // 2. Fetch all comments for this video (populated with author details)
  const allComments = await Comment.find({ video: videoId })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });

  const currentUserId = req.user ? req.user._id : null;
  const fullTree = buildCommentTree(allComments, currentUserId);

  // 3. Paginate top-level comments (replies remain nested under parents)
  const totalTopLevel = fullTree.length;
  const totalPages = Math.ceil(totalTopLevel / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedTree = fullTree.slice(startIndex, startIndex + limit);

  return res.status(httpStatus.OK).json(
    new ApiResponse(
      httpStatus.OK,
      {
        comments: paginatedTree,
        totalComments: allComments.length,
        totalTopLevel,
        page,
        limit,
        totalPages,
        videoUploaderId: video.uploadedBy ? video.uploadedBy.toString() : null
      },
      'Comments fetched successfully'
    )
  );
});

// @desc    Create a new comment or reply
// @route   POST /api/v1/comments/video/:videoId
// @access  Private
exports.createComment = asyncHandler(async (req, res, next) => {
  const { videoId } = req.params;
  const { text, parentComment, showLocation } = req.body;

  // 1. Verify Video Exists & is a Platform Video
  const video = await Video.findById(videoId);
  if (!video) {
    return next(new ApiError(httpStatus.NOT_FOUND, 'Video not found'));
  }

  if (video.source && video.source !== 'platform') {
    return next(new ApiError(httpStatus.FORBIDDEN, 'Comments are only supported for platform videos.'));
  }

  // 2. Moderation & Safety Content Validation
  const validation = validateCommentContent(text);
  if (!validation.isClean) {
    return next(new ApiError(httpStatus.BAD_REQUEST, validation.error));
  }

  // 3. Validate Parent Comment if this is a reply
  let parentDoc = null;
  if (parentComment) {
    parentDoc = await Comment.findById(parentComment);
    if (!parentDoc) {
      return next(new ApiError(httpStatus.NOT_FOUND, 'Parent comment not found'));
    }
    if (parentDoc.video.toString() !== videoId) {
      return next(new ApiError(httpStatus.BAD_REQUEST, 'Parent comment belongs to a different video.'));
    }
  }

  // 4. Determine optional location display
  const userLocation = req.user.city || '';

  // 5. Create Comment Document
  const newComment = await Comment.create({
    video: videoId,
    user: req.user._id,
    text: text.trim(),
    parentComment: parentComment || null,
    showLocation: Boolean(showLocation),
    location: Boolean(showLocation) ? userLocation : '',
  });

  const populatedComment = await Comment.findById(newComment._id).populate('user', 'name avatar');
  const formattedTree = buildCommentTree([populatedComment], req.user._id)[0];

  // 6. Broadcast Socket.IO event to video_<videoId> room
  const roomId = `video_${videoId}`;
  emitSocketEvent(req, roomId, 'comment-added', {
    comment: formattedTree,
    videoId,
    parentCommentId: parentComment || null
  });

  return res.status(httpStatus.CREATED).json(
    new ApiResponse(httpStatus.CREATED, { comment: formattedTree }, 'Comment posted successfully')
  );
});

// @desc    Edit existing comment text
// @route   PUT /api/v1/comments/:commentId
// @access  Private
exports.editComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;
  const { text } = req.body;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return next(new ApiError(httpStatus.NOT_FOUND, 'Comment not found'));
  }

  // Verify Video
  const video = await Video.findById(comment.video);
  if (!video || (video.source && video.source !== 'platform')) {
    return next(new ApiError(httpStatus.FORBIDDEN, 'Comments are only supported for platform videos.'));
  }

  // Authorization: Only comment author can edit
  if (comment.user.toString() !== req.user._id.toString()) {
    return next(new ApiError(httpStatus.FORBIDDEN, 'Not authorized to edit this comment'));
  }

  // Moderation Check
  const validation = validateCommentContent(text);
  if (!validation.isClean) {
    return next(new ApiError(httpStatus.BAD_REQUEST, validation.error));
  }

  comment.text = text.trim();
  comment.isEdited = true;
  await comment.save();

  const populatedComment = await Comment.findById(comment._id).populate('user', 'name avatar');
  const formattedComment = buildCommentTree([populatedComment], req.user._id)[0];

  const roomId = `video_${comment.video}`;
  emitSocketEvent(req, roomId, 'comment-updated', {
    comment: formattedComment,
    videoId: comment.video.toString(),
    action: 'edit'
  });

  return res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, { comment: formattedComment }, 'Comment updated successfully')
  );
});

// @desc    Delete comment (and recursively delete all nested replies)
// @route   DELETE /api/v1/comments/:commentId
// @access  Private
exports.deleteComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return next(new ApiError(httpStatus.NOT_FOUND, 'Comment not found'));
  }

  const video = await Video.findById(comment.video);
  if (!video || (video.source && video.source !== 'platform')) {
    return next(new ApiError(httpStatus.FORBIDDEN, 'Comments are only supported for platform videos.'));
  }

  // Authorization: Comment Author OR Video Creator
  const isAuthor = comment.user.toString() === req.user._id.toString();
  const isVideoCreator = video.uploadedBy && video.uploadedBy.toString() === req.user._id.toString();

  if (!isAuthor && !isVideoCreator) {
    return next(new ApiError(httpStatus.FORBIDDEN, 'Not authorized to delete this comment'));
  }

  // Recursive deletion of comment and all child descendants
  const descendantIds = await getDescendantCommentIds(commentId);
  await Comment.deleteMany({ _id: { $in: descendantIds } });

  const roomId = `video_${comment.video}`;
  emitSocketEvent(req, roomId, 'comment-deleted', {
    commentId: commentId.toString(),
    deletedIds: descendantIds,
    videoId: comment.video.toString()
  });

  return res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, { deletedIds: descendantIds }, 'Comment deleted successfully')
  );
});

// @desc    Toggle Like on comment
// @route   POST /api/v1/comments/:commentId/like
// @access  Private
exports.toggleLikeComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;
  const userId = req.user._id.toString();

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return next(new ApiError(httpStatus.NOT_FOUND, 'Comment not found'));
  }

  const video = await Video.findById(comment.video);
  if (!video || (video.source && video.source !== 'platform')) {
    return next(new ApiError(httpStatus.FORBIDDEN, 'Comments are only supported for platform videos.'));
  }

  const likedIndex = comment.likes.findIndex(id => id.toString() === userId);
  const dislikedIndex = comment.dislikes.findIndex(id => id.toString() === userId);

  if (likedIndex > -1) {
    // Remove like
    comment.likes.splice(likedIndex, 1);
  } else {
    // Add like and remove dislike if present
    comment.likes.push(req.user._id);
    if (dislikedIndex > -1) {
      comment.dislikes.splice(dislikedIndex, 1);
    }
  }

  await comment.save();

  const populatedComment = await Comment.findById(comment._id).populate('user', 'name avatar');
  const formattedComment = buildCommentTree([populatedComment], req.user._id)[0];

  const roomId = `video_${comment.video}`;
  emitSocketEvent(req, roomId, 'comment-updated', {
    comment: formattedComment,
    videoId: comment.video.toString(),
    action: 'like'
  });

  return res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, { comment: formattedComment }, 'Reaction updated')
  );
});

// @desc    Toggle Dislike on comment
// @route   POST /api/v1/comments/:commentId/dislike
// @access  Private
exports.toggleDislikeComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;
  const userId = req.user._id.toString();

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return next(new ApiError(httpStatus.NOT_FOUND, 'Comment not found'));
  }

  const video = await Video.findById(comment.video);
  if (!video || (video.source && video.source !== 'platform')) {
    return next(new ApiError(httpStatus.FORBIDDEN, 'Comments are only supported for platform videos.'));
  }

  const likedIndex = comment.likes.findIndex(id => id.toString() === userId);
  const dislikedIndex = comment.dislikes.findIndex(id => id.toString() === userId);

  if (dislikedIndex > -1) {
    // Remove dislike
    comment.dislikes.splice(dislikedIndex, 1);
  } else {
    // Add dislike and remove like if present
    comment.dislikes.push(req.user._id);
    if (likedIndex > -1) {
      comment.likes.splice(likedIndex, 1);
    }
  }

  await comment.save();

  const populatedComment = await Comment.findById(comment._id).populate('user', 'name avatar');
  const formattedComment = buildCommentTree([populatedComment], req.user._id)[0];

  const roomId = `video_${comment.video}`;
  emitSocketEvent(req, roomId, 'comment-updated', {
    comment: formattedComment,
    videoId: comment.video.toString(),
    action: 'dislike'
  });

  return res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, { comment: formattedComment }, 'Reaction updated')
  );
});

// @desc    Report a comment for moderation review
// @route   POST /api/v1/comments/:commentId/report
// @access  Private
exports.reportComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;
  const userId = req.user._id.toString();

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return next(new ApiError(httpStatus.NOT_FOUND, 'Comment not found'));
  }

  const video = await Video.findById(comment.video);
  if (!video || (video.source && video.source !== 'platform')) {
    return next(new ApiError(httpStatus.FORBIDDEN, 'Comments are only supported for platform videos.'));
  }

  const alreadyReported = comment.reports.some(id => id.toString() === userId);
  if (!alreadyReported) {
    comment.reports.push(req.user._id);
    comment.isReported = true;
    comment.reportCount = comment.reports.length;
    await comment.save();
  }

  const populatedComment = await Comment.findById(comment._id).populate('user', 'name avatar');
  const formattedComment = buildCommentTree([populatedComment], req.user._id)[0];

  const roomId = `video_${comment.video}`;
  emitSocketEvent(req, roomId, 'comment-updated', {
    comment: formattedComment,
    videoId: comment.video.toString(),
    action: 'report'
  });

  return res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, { comment: formattedComment }, 'Comment reported for review')
  );
});

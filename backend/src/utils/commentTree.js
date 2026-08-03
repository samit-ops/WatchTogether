// Tree formatting utility for nested comments

/**
 * Format a single comment document into clean JSON
 * @param {Object} comment 
 * @param {string|null} currentUserId 
 * @returns {Object} Clean comment object
 */
function formatSingleComment(comment, currentUserId = null) {
  if (!comment) return null;
  const doc = comment.toObject ? comment.toObject() : { ...comment };
  const likesArr = doc.likes || [];
  const dislikesArr = doc.dislikes || [];
  const reportsArr = doc.reports || [];

  const commentId = doc._id ? doc._id.toString() : (doc.id ? doc.id.toString() : '');
  const videoId = doc.video ? (doc.video._id ? doc.video._id.toString() : doc.video.toString()) : null;
  const parentCommentId = doc.parentComment ? (doc.parentComment._id ? doc.parentComment._id.toString() : doc.parentComment.toString()) : null;

  return {
    id: commentId,
    _id: commentId,
    video: videoId,
    user: doc.user ? {
      id: doc.user._id ? doc.user._id.toString() : (doc.user.id ? doc.user.id.toString() : 'unknown'),
      _id: doc.user._id ? doc.user._id.toString() : (doc.user.id ? doc.user.id.toString() : 'unknown'),
      name: doc.user.name || 'User',
      avatar: doc.user.avatar || '',
    } : { id: 'unknown', name: 'User', avatar: '' },
    text: doc.text || '',
    parentComment: parentCommentId,
    likesCount: likesArr.length,
    dislikesCount: dislikesArr.length,
    isLiked: currentUserId ? likesArr.some(id => id.toString() === currentUserId.toString()) : false,
    isDisliked: currentUserId ? dislikesArr.some(id => id.toString() === currentUserId.toString()) : false,
    showLocation: doc.showLocation || false,
    location: doc.showLocation ? (doc.location || '') : '',
    isReported: doc.isReported || false,
    reportCount: reportsArr.length,
    isEdited: doc.isEdited || false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    replies: []
  };
}

/**
 * Transforms flat array of comment documents into a nested hierarchy
 * @param {Array} comments 
 * @param {string|null} currentUserId 
 * @returns {Array} Nested comment tree
 */
function buildCommentTree(comments, currentUserId = null) {
  const map = {};
  const roots = [];

  // 1. Format each comment into clean JSON with calculated fields
  (comments || []).forEach(comment => {
    const formatted = formatSingleComment(comment, currentUserId);
    if (formatted && formatted.id) {
      map[formatted.id] = formatted;
    }
  });

  // 2. Build tree by connecting replies to parent comments
  Object.keys(map).forEach(id => {
    const comment = map[id];
    if (comment.parentComment && map[comment.parentComment]) {
      map[comment.parentComment].replies.push(comment);
    } else if (!comment.parentComment) {
      roots.push(comment);
    } else {
      // Parent comment is in DB but not in this map batch -> keep as root or single item
      roots.push(comment);
    }
  });

  return roots;
}

module.exports = { buildCommentTree, formatSingleComment };

// Tree formatting utility for nested comments

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
  comments.forEach(comment => {
    const doc = comment.toObject ? comment.toObject() : { ...comment };
    const likesArr = doc.likes || [];
    const dislikesArr = doc.dislikes || [];
    const reportsArr = doc.reports || [];

    map[doc._id.toString()] = {
      id: doc._id.toString(),
      _id: doc._id.toString(),
      video: doc.video,
      user: doc.user ? {
        id: doc.user._id ? doc.user._id.toString() : doc.user.id,
        _id: doc.user._id ? doc.user._id.toString() : doc.user.id,
        name: doc.user.name || 'User',
        avatar: doc.user.avatar || '',
      } : { id: 'unknown', name: 'User', avatar: '' },
      text: doc.text,
      parentComment: doc.parentComment ? doc.parentComment.toString() : null,
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
  });

  // 2. Build tree by connecting replies to parent comments
  Object.keys(map).forEach(id => {
    const comment = map[id];
    if (comment.parentComment && map[comment.parentComment]) {
      map[comment.parentComment].replies.push(comment);
    } else if (!comment.parentComment) {
      roots.push(comment);
    }
  });

  return roots;
}

module.exports = { buildCommentTree };

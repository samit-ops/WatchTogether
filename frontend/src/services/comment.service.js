import api from './api';

export const commentService = {
  // Fetch paginated top-level comments with nested replies for a video
  getCommentsByVideo: async (videoId, page = 1, limit = 20) => {
    const response = await api.get(`/v1/comments/video/${videoId}?page=${page}&limit=${limit}`);
    return response;
  },

  // Create a new top-level comment or reply
  createComment: async (videoId, text, parentComment = null, showLocation = false, location = '') => {
    const response = await api.post(`/v1/comments/video/${videoId}`, {
      text,
      parentComment,
      showLocation,
      location
    });
    return response;
  },

  // Edit an existing comment
  editComment: async (commentId, text) => {
    const response = await api.put(`/v1/comments/${commentId}`, { text });
    return response;
  },

  // Delete a comment (and its child replies)
  deleteComment: async (commentId) => {
    const response = await api.delete(`/v1/comments/${commentId}`);
    return response;
  },

  // Toggle Like reaction
  toggleLike: async (commentId) => {
    const response = await api.post(`/v1/comments/${commentId}/like`);
    return response;
  },

  // Toggle Dislike reaction
  toggleDislike: async (commentId) => {
    const response = await api.post(`/v1/comments/${commentId}/dislike`);
    return response;
  },

  // Report comment for moderation review
  reportComment: async (commentId) => {
    const response = await api.post(`/v1/comments/${commentId}/report`);
    return response;
  }
};

export default commentService;

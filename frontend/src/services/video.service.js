import api from './api';

const videoService = {
  getAllVideos: async (search = '', category = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'All') params.append('category', category);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/v1/videos${queryString}`);
    return response.data;
  },
  
  getVideoById: async (id) => {
    const response = await api.get(`/v1/videos/${id}`);
    return response.data;
  },

  incrementViews: async (id) => {
    const response = await api.put(`/v1/videos/${id}/view`);
    return response.data;
  },

  uploadVideo: async (formData, onProgress) => {
    const response = await api.post('/v1/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 0, // Unlimited timeout for large video uploads
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
    return response.data || response;
  },

  updateVideo: async (id, data) => {
    const response = await api.put(`/v1/videos/${id}`, data);
    return response.data;
  },

  deleteVideo: async (id) => {
    const response = await api.delete(`/v1/videos/${id}`);
    return response.data;
  },

  likeVideo: async (id) => {
    const response = await api.post(`/v1/videos/${id}/like`);
    return response.data;
  },

  dislikeVideo: async (id) => {
    const response = await api.post(`/v1/videos/${id}/dislike`);
    return response.data;
  },

  getMyVideos: async () => {
    const response = await api.get('/v1/videos/me');
    return response.data;
  }
};

export default videoService;

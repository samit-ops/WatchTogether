import api from './api';

const videoService = {
  getAllVideos: async () => {
    const response = await api.get('/v1/videos');
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

  uploadVideo: async (formData) => {
    const response = await api.post('/v1/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateVideo: async (id, data) => {
    const response = await api.put(`/v1/videos/${id}`, data);
    return response.data;
  },

  deleteVideo: async (id) => {
    const response = await api.delete(`/v1/videos/${id}`);
    return response.data;
  }
};

export default videoService;

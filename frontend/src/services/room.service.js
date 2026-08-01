import api from './api';

export const roomService = {
  createRoom: (videoId) => api.post('/v1/rooms', { videoId, type: 'video' }),
  createLiveRoom: () => api.post('/v1/rooms', { type: 'live' }),
  getRoom: (roomId) => api.get(`/v1/rooms/${roomId}`),
  leaveRoom: (roomId) => api.post('/v1/rooms/leave', { roomId }),
  deleteRoom: (roomId) => api.delete(`/v1/rooms/${roomId}`)
};

export default roomService;

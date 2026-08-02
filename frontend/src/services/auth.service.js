import api from './api';

const authService = {
  login: async (email, password) => {
    const response = await api.post('/v1/auth/login', { email, password });
    return response.data;
  },
  
  register: async (name, email, password, phoneNumber, city, pincode) => {
    const response = await api.post('/v1/auth/register', { name, email, password, phoneNumber, city, pincode });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/v1/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/v1/auth/me');
    return response.data;
  }
};

export default authService;

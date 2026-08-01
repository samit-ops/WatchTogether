import api from './api';

const subscriptionService = {
  getPlans: async () => {
    const response = await api.get('/v1/subscriptions/plans');
    return response;
  },

  createOrder: async (plan) => {
    try {
      const response = await api.post('/v1/subscriptions/create-order', { plan });
      return response;
    } catch (error) {
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  verifyPayment: async (paymentData) => {
    try {
      const response = await api.post('/v1/subscriptions/verify-payment', paymentData);
      return response;
    } catch (error) {
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  getCurrentSubscription: async () => {
    const response = await api.get('/v1/subscriptions/current');
    return response;
  },

  getPaymentHistory: async () => {
    const response = await api.get('/v1/subscriptions/history');
    return response;
  }
};

export default subscriptionService;

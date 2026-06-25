import api from '../lib/api';

const reviewService = {
  async getReviews(params = {}) {
    const response = await api.get('/reviews', { params });
    return response.data;
  },

  async getReview(id) {
    const response = await api.get(`/reviews/${id}`);
    return response.data;
  },

  async getSupplierReviews(supplierId) {
    const response = await api.get(`/suppliers/${supplierId}/reviews`);
    return response.data;
  },

  async createReview(data) {
    const response = await api.post('/reviews', data);
    return response.data;
  },

  async updateReview(id, data) {
    const response = await api.put(`/reviews/${id}`, data);
    return response.data;
  },

  async deleteReview(id) {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  },

  async getMyReviews() {
    const response = await api.get('/my-reviews');
    return response.data;
  },
};

export default reviewService;

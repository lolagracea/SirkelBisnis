import api from '../lib/api';

const aiService = {
  async getReviewSummary(supplierId) {
    const response = await api.get(`/ai/review-summary/${supplierId}`);
    return response.data;
  },

  async getBusinessInsight() {
    const response = await api.get('/ai/business-insight');
    return response.data;
  },

  async getRestockPrediction(currentStock) {
    const response = await api.get('/ai/restock', {
      params: { current_stock: currentStock }
    });
    return response.data;
  },

  async getQuantityRecommendation(currentStock) {
    const response = await api.get('/ai/recommend-quantity', {
      params: { current_stock: currentStock }
    });
    return response.data;
  },

  async getGroupBuyingMatch(latitude, longitude) {
    const response = await api.get('/ai/group-buying-match', {
      params: { latitude, longitude }
    });
    return response.data;
  },

  async getPriceAnalysis(productId) {
    const response = await api.get(`/ai/price-analysis/${productId}`);
    return response.data;
  },
};

export default aiService;

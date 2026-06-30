import api from '../lib/api';

const supplierAnalyticsService = {
  getAnalytics: async () => {
    const response = await api.get('/analytics/supplier');
    return response.data;
  },
};

export default supplierAnalyticsService;

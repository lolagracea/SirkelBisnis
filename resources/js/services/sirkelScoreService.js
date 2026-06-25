import api from '../lib/api';

const sirkelScoreService = {
  async getSupplierSirkelScore(supplierId) {
    const response = await api.get(`/suppliers/${supplierId}/sirkel-score`);
    return response.data;
  },

  async recalculateScores() {
    const response = await api.post('/admin/recalculate-sirkel-score');
    return response.data;
  },
};

export default sirkelScoreService;

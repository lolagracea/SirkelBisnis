import api from '../lib/api';

const returnService = {
  getReturns: async () => {
    const response = await api.get('/supplier-returns');
    return response.data;
  },
  updateStatus: async (id, status, supplier_notes) => {
    const response = await api.patch(`/supplier-returns/${id}/status`, { status, supplier_notes });
    return response.data;
  }
};

export default returnService;

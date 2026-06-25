import api from '../lib/api';

const supplierService = {
  async getSuppliers(params = {}) {
    const response = await api.get('/suppliers', { params });
    return response.data;
  },

  async getSupplier(id) {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },
};

export default supplierService;

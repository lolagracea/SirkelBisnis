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

  /**
   * Update the authenticated supplier's profile.
   * @param {number} id - Supplier profile ID
   * @param {object} data - Fields to update (supplier_name, description, address, etc.)
   */
  async updateSupplier(id, data) {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
  },
};

export default supplierService;

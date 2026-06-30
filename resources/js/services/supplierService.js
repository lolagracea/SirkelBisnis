import api from '../lib/api';

const supplierService = {
  async getSuppliers(params = {}) {
    const response = await api.get('/suppliers', { params });
    return response.data;
  },

  /**
   * Search suppliers by name/description/address.
   * Sends the query straight to the backend instead of filtering
   * a previously-fetched, paginated list on the client.
   * @param {string} search - search keyword
   * @param {object} extraParams - additional query params (e.g. per_page, verified, sort_by)
   */
  async searchSuppliers(search = '', extraParams = {}) {
    const response = await api.get('/suppliers', {
      params: { search, ...extraParams },
    });
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
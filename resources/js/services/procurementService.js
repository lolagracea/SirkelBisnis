import api from '../lib/api';

const procurementService = {
  getManufacturers: async () => {
    const response = await api.get('/procurement/manufacturers');
    return response.data;
  },
  addManufacturer: async (data) => {
    const response = await api.post('/procurement/manufacturers', data);
    return response.data;
  },
  getPurchaseOrders: async () => {
    const response = await api.get('/procurement/purchase-orders');
    return response.data;
  },
  createPurchaseOrder: async (data) => {
    const response = await api.post('/procurement/purchase-orders', data);
    return response.data;
  },
  receivePurchaseOrder: async (id) => {
    const response = await api.post(`/procurement/purchase-orders/${id}/receive`);
    return response.data;
  }
};

export default procurementService;

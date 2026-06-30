import api from '../lib/api';

const orderService = {
  async getOrders(params = {}) {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  async getOrder(id) {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  async createOrder(orderData) {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  async getMyOrders() {
    const response = await api.get('/my-orders');
    return response.data;
  },

  async getSupplierOrders() {
    const response = await api.get('/supplier-orders');
    return response.data;
  },

  async updateOrderStatus(id, status, extraData = {}) {
    const response = await api.patch(`/orders/${id}/status`, { status, ...extraData });
    return response.data;
  },

  async updateOrderPayment(id, data) {
    // data is { payment_status: 'paid' }
    const response = await api.patch(`/orders/${id}/payment`, data);
    return response.data;
  },
};

export default orderService;

import axios from 'axios';

const api = axios.create({
  baseURL: '/api/procurement',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const procurementService = {
  getManufacturers: async () => {
    const response = await api.get('/manufacturers');
    return response.data;
  },
  addManufacturer: async (data) => {
    const response = await api.post('/manufacturers', data);
    return response.data;
  },
  getPurchaseOrders: async () => {
    const response = await api.get('/purchase-orders');
    return response.data;
  },
  createPurchaseOrder: async (data) => {
    const response = await api.post('/purchase-orders', data);
    return response.data;
  },
  receivePurchaseOrder: async (id) => {
    const response = await api.post(`/purchase-orders/${id}/receive`);
    return response.data;
  }
};

export default procurementService;

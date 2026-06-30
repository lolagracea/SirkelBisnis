import axios from 'axios';

const api = axios.create({
  baseURL: '/api/supplier-returns',
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

const returnService = {
  getReturns: async () => {
    const response = await api.get('/');
    return response.data;
  },
  updateStatus: async (id, status, supplier_notes) => {
    const response = await api.patch(`/${id}/status`, { status, supplier_notes });
    return response.data;
  }
};

export default returnService;

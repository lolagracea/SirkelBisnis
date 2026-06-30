import axios from 'axios';

const api = axios.create({
  baseURL: '/api/supplier-staff',
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

const supplierStaffService = {
  getStaff: async () => {
    const response = await api.get('/');
    return response.data;
  },
  addStaff: async (data) => {
    const response = await api.post('/', data);
    return response.data;
  },
  removeStaff: async (id) => {
    const response = await api.delete(`/${id}`);
    return response.data;
  }
};

export default supplierStaffService;

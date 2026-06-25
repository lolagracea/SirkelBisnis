import api from '../lib/api';

const authService = {
  async login(credentials) {
    const response = await api.post('/login', credentials);
    if (response.data.success && response.data.token) {
      localStorage.setItem('sirkel_token', response.data.token);
      localStorage.setItem('sirkel_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async registerUmkm(data) {
    const response = await api.post('/register/umkm', data);
    return response.data;
  },

  async registerSupplier(data) {
    const response = await api.post('/register/supplier', data);
    return response.data;
  },

  async logout() {
    try {
      await api.post('/logout');
    } finally {
      localStorage.removeItem('sirkel_token');
      localStorage.removeItem('sirkel_user');
    }
  },

  async getCurrentUser() {
    const response = await api.get('/user');
    return response.data;
  },
};

export default authService;

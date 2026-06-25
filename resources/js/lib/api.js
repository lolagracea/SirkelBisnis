import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor: Attach Sanctum Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sirkel_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (response) {
      switch (response.status) {
        case 401:
          // Unauthorized - Clear local storage and redirect to login
          localStorage.removeItem('sirkel_token');
          localStorage.removeItem('sirkel_user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        case 403:
          // Forbidden
          console.error('Akses ditolak (403): Anda tidak memiliki izin.');
          break;
        case 500:
          // Internal Server Error
          console.error('Kesalahan Server Internal (500): Silakan coba beberapa saat lagi.');
          break;
        default:
          break;
      }
    } else {
      // Network Error
      console.error('Kesalahan Jaringan: Tidak dapat terhubung ke server.');
    }

    return Promise.reject(error);
  }
);

export default api;

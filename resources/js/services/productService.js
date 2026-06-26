import api from '../lib/api';

const productService = {
  async getProducts(params = {}) {
    const response = await api.get('/products', { params });
    return response.data;
  },

  async getProduct(id) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  async createProduct(productData) {
    const headers = productData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    const response = await api.post('/products', productData, { headers });
    return response.data;
  },

  async updateProduct(id, productData) {
    if (productData instanceof FormData) {
      productData.append('_method', 'PUT');
      const response = await api.post(`/products/${id}`, productData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } else {
      const response = await api.put(`/products/${id}`, productData);
      return response.data;
    }
  },

  async deleteProduct(id) {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};

export default productService;

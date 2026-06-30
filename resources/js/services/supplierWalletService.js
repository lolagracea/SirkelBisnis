import api from '../lib/api';

const supplierWalletService = {
  getSummary: async () => {
    const response = await api.get('/wallet');
    return response.data;
  },

  withdraw: async (amount) => {
    const response = await api.post('/wallet/withdraw', { amount });
    return response.data;
  },
};

export default supplierWalletService;

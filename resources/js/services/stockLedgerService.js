import api from '../lib/api';

const stockLedgerService = {
  getByProduct: async (productId) => {
    const response = await api.get(`/products/${productId}/stock-ledger`);
    return response.data;
  },
};

export default stockLedgerService;

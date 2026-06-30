import api from '../lib/api';

const supplierOfferService = {
  /**
   * Submit a price offer for a specific Group Buying campaign.
   * @param {number} groupBuyingId
   * @param {{ price_per_unit: number, notes?: string }} data
   */
  async createOffer(groupBuyingId, data) {
    const response = await api.post(`/group-buyings/${groupBuyingId}/offer`, data);
    return response.data;
  },

  /**
   * Get all offers submitted by the authenticated supplier.
   */
  async getMyOffers() {
    const response = await api.get('/my-offers');
    return response.data;
  },
};

export default supplierOfferService;

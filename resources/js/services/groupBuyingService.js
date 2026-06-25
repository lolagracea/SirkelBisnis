import api from '../lib/api';

const groupBuyingService = {
  async getGroupBuyings(params = {}) {
    const response = await api.get('/group-buyings', { params });
    return response.data;
  },

  async getGroupBuying(id) {
    const response = await api.get(`/group-buyings/${id}`);
    return response.data;
  },

  async createGroupBuying(data) {
    const response = await api.post('/group-buyings', data);
    return response.data;
  },

  async joinGroupBuying(id, data) {
    // data can contain { quantity: 10 }
    const response = await api.post(`/group-buyings/${id}/join`, data);
    return response.data;
  },

  async deleteGroupBuying(id) {
    const response = await api.delete(`/group-buyings/${id}`);
    return response.data;
  },

  async getMyGroupBuyings() {
    const response = await api.get('/my-group-buyings');
    return response.data;
  },

  async getJoinedGroupBuyings() {
    const response = await api.get('/joined-group-buyings');
    return response.data;
  },
};

export default groupBuyingService;

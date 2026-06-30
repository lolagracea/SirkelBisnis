import api from '../lib/api';

const supplierStaffService = {
  getStaff: async () => {
    const response = await api.get('/supplier-staff');
    return response.data;
  },
  addStaff: async (data) => {
    const response = await api.post('/supplier-staff', data);
    return response.data;
  },
  removeStaff: async (id) => {
    const response = await api.delete(`/supplier-staff/${id}`);
    return response.data;
  }
};

export default supplierStaffService;

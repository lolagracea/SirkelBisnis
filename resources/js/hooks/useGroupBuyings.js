import { useState, useCallback } from 'react';
import groupBuyingService from '../services/groupBuyingService';

export default function useGroupBuyings() {
  const [groupBuyings, setGroupBuyings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGroupBuyings = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await groupBuyingService.getGroupBuyings(params);
      const list = Array.isArray(data) ? data : (data.data || []);
      setGroupBuyings(list);
      return list;
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat patungan aktif.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const startGroupBuying = async (campaignData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await groupBuyingService.createGroupBuying(campaignData);
      const newCampaign = response.data || response;
      setGroupBuyings((prev) => [newCampaign, ...prev]);
      return newCampaign;
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat patungan baru.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const joinGroupBuying = async (id, quantity) => {
    setLoading(true);
    setError(null);
    try {
      const response = await groupBuyingService.joinGroupBuying(id, { quantity });
      // Update local state if the campaign is still open/returned
      const updatedCampaign = response.data || response;
      setGroupBuyings((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updatedCampaign } : c))
      );
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal bergabung ke patungan.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    groupBuyings,
    loading,
    error,
    fetchGroupBuyings,
    startGroupBuying,
    joinGroupBuying,
  };
}

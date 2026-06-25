import { useState, useCallback } from 'react';
import aiService from '../services/aiService';

export default function useAIInsight() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBusinessInsight = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await aiService.getBusinessInsight();
      return data.data || data;
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat AI Business Insight.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRestockPrediction = useCallback(async (currentStock) => {
    setLoading(true);
    setError(null);
    try {
      const data = await aiService.getRestockPrediction(currentStock);
      return data.data || data;
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat prediksi restock.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGroupBuyingMatch = useCallback(async (lat, lng) => {
    setLoading(true);
    setError(null);
    try {
      const data = await aiService.getGroupBuyingMatch(lat, lng);
      return data.data || data;
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat pencocokan patungan.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReviewSummary = useCallback(async (supplierId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await aiService.getReviewSummary(supplierId);
      return data.data || data;
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat ringkasan ulasan AI.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPriceAnalysis = useCallback(async (productId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await aiService.getPriceAnalysis(productId);
      return data.data || data;
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat analisis harga.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchBusinessInsight,
    fetchRestockPrediction,
    fetchGroupBuyingMatch,
    fetchReviewSummary,
    fetchPriceAnalysis,
  };
}

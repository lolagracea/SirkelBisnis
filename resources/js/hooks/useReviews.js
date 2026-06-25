import { useState, useCallback } from 'react';
import reviewService from '../services/reviewService';

export default function useReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSupplierReviews = useCallback(async (supplierId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await reviewService.getSupplierReviews(supplierId);
      const list = Array.isArray(data) ? data : (data.data || []);
      setReviews(list);
      return list;
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat ulasan supplier.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addReview = async (reviewData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await reviewService.createReview(reviewData);
      const newReview = response.data || response;
      setReviews((prev) => [newReview, ...prev]);
      return newReview;
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirimkan ulasan.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    reviews,
    loading,
    error,
    fetchSupplierReviews,
    addReview,
  };
}

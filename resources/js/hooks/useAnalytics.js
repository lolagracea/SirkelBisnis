import { useState, useCallback } from 'react';
import supplierAnalyticsService from '../services/supplierAnalyticsService';

export default function useAnalytics() {
  const [analytics, setAnalytics] = useState({ top_products: [], sales_trend: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await supplierAnalyticsService.getAnalytics();
      if (res.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { analytics, loading, error, fetchAnalytics };
}

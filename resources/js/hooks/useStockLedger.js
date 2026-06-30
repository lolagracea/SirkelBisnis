import { useState, useCallback } from 'react';
import stockLedgerService from '../services/stockLedgerService';

export default function useStockLedger() {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLedgers = useCallback(async (productId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await stockLedgerService.getByProduct(productId);
      if (res.success) {
        setLedgers(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { ledgers, loading, error, fetchLedgers };
}

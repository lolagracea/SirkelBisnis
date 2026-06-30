import { useState, useCallback } from 'react';
import supplierWalletService from '../services/supplierWalletService';

export default function useWallet() {
  const [wallet, setWallet] = useState({ balance: 0, pending_balance: 0, transactions: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await supplierWalletService.getSummary();
      if (res.success) {
        setWallet(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const withdraw = async (amount) => {
    setLoading(true);
    try {
      const res = await supplierWalletService.withdraw(amount);
      await fetchWallet();
      return res;
    } finally {
      setLoading(false);
    }
  };

  return { wallet, loading, error, fetchWallet, withdraw };
}

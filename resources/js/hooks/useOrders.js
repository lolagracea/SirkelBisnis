import { useState, useCallback } from 'react';
import orderService from '../services/orderService';

export default function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMyOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getMyOrders();
      const list = Array.isArray(data) ? data : (data.data || []);
      setOrders(list);
      return list;
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat pesanan Anda.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSupplierOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getSupplierOrders();
      const list = Array.isArray(data) ? data : (data.data || []);
      setOrders(list);
      return list;
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat pesanan supplier.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const placeOrder = async (orderData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.createOrder(orderData);
      const newOrder = response.data || response;
      setOrders((prev) => [newOrder, ...prev]);
      return newOrder;
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat pesanan.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (id, status) => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.updateOrderStatus(id, status);
      const updated = response.data || response;
      setOrders((prev) =>
        prev.map((o) => (o.id === id || o.order_code === id ? { ...o, status: updated.status } : o))
      );
      return updated;
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal merubah status pesanan.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const payOrder = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.updateOrderPayment(id, { payment_status: 'paid' });
      const updated = response.data || response;
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, payment_status: 'paid', status: 'paid' } : o))
      );
      return updated;
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal melakukan pembayaran.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    orders,
    loading,
    error,
    fetchMyOrders,
    fetchSupplierOrders,
    placeOrder,
    changeStatus,
    payOrder,
  };
}

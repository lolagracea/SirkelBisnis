import { useState, useCallback } from 'react';
import productService from '../services/productService';

export default function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getProducts(params);
      // Backend returns a paginated list or direct array under 'data' or directly
      const list = Array.isArray(data) ? data : (data.data || []);
      setProducts(list);
      return list;
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat produk.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addProduct = async (productData) => {
    setLoading(true);
    setError(null);
    try {
      const newProduct = await productService.createProduct(productData);
      setProducts((prev) => [newProduct.data || newProduct, ...prev]);
      return newProduct;
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambah produk.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const editProduct = async (id, productData) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await productService.updateProduct(id, productData);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? (updated.data || updated) : p))
      );
      return updated;
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengubah produk.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await productService.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus produk.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    editProduct,
    removeProduct,
  };
}

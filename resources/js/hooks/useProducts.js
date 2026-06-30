import { useState, useCallback } from 'react';
import productService from '../services/productService';

export default function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    current_page: 1,
    last_page: 1,
    per_page: 10,
  });

  const fetchProducts = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getProducts(params);
      const list = Array.isArray(data) ? data : (data.data || []);
      setProducts(list);
      // Store pagination meta if available
      if (data?.meta) {
        setPagination({
          total: data.meta.total ?? list.length,
          current_page: data.meta.current_page ?? 1,
          last_page: data.meta.last_page ?? 1,
          per_page: data.meta.per_page ?? 10,
        });
      }
      return list;
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat produk.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch a specific page of products.
   * @param {number} page - Page number (1-indexed)
   * @param {object} extraParams - Additional query params (e.g. supplier_id)
   */
  const fetchProductsPage = useCallback(async (page = 1, extraParams = {}) => {
    return fetchProducts({ page, ...extraParams });
  }, [fetchProducts]);

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
    pagination,
    fetchProducts,
    fetchProductsPage,
    addProduct,
    editProduct,
    removeProduct,
  };
}


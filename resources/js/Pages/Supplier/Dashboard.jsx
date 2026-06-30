import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import useProducts from '../../hooks/useProducts';
import useOrders from '../../hooks/useOrders';
import useGroupBuyings from '../../hooks/useGroupBuyings';
import useReviews from '../../hooks/useReviews';
import useAIInsight from '../../hooks/useAIInsight.js';
import useWallet from '../../hooks/useWallet.js';
import useAnalytics from '../../hooks/useAnalytics.js';
import useStockLedger from '../../hooks/useStockLedger.js';
import sirkelScoreService from '../../services/sirkelScoreService';
import supplierOfferService from '../../services/supplierOfferService';
import supplierService from '../../services/supplierService';
import { 
  Package, 
  Layers, 
  ShoppingCart, 
  Star, 
  Sparkles, 
  Plus, 
  TrendingUp, 
  ArrowUpRight, 
  Users, 
  DollarSign,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronRight,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit3,
  Trash2,
  MapPin,
  Info,
  Filter,
  Check,
  ChevronDown,
  ArrowRight,
  Sliders,
  Wallet,
  Activity,
  Truck,
  MessageCircle,
  FileText,
  FileSpreadsheet,
  Tag,
  ShieldAlert,
  Upload,
  Store,
  Landmark
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import InvoicesTab from './Tabs/InvoicesTab';
import ChatTab from './Tabs/ChatTab';
import VoucherTab from './Tabs/VoucherTab';
import DisputeTab from './Tabs/DisputeTab';
import CrmTab from './Tabs/CrmTab';
import StorefrontTab from './Tabs/StorefrontTab';
import BankAccountsTab from './Tabs/BankAccountsTab';
import StaffTab from './Tabs/StaffTab';
import ReturnsTab from './Tabs/ReturnsTab';
import ProcurementTab from './Tabs/ProcurementTab';
import AdvancedB2bTab from './Tabs/AdvancedB2bTab';

export default function Dashboard({ flash = {} } = {}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  const { products, loading: prodLoading, pagination: productPagination, fetchProducts, fetchProductsPage, addProduct, editProduct, removeProduct } = useProducts();
  const { orders, loading: ordersLoading, fetchSupplierOrders, changeStatus } = useOrders();
  const { groupBuyings, loading: gbLoading, fetchGroupBuyings } = useGroupBuyings();
  const { reviews, loading: reviewsLoading, fetchSupplierReviews } = useReviews();
  const { fetchReviewSummary } = useAIInsight();
  const { wallet, loading: walletLoading, fetchWallet, withdraw } = useWallet();
  const { analytics, loading: analyticsLoading, fetchAnalytics } = useAnalytics();
  const { ledgers, loading: ledgerLoading, fetchLedgers } = useStockLedger();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  // Confirmation Modals State
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [orderToProcess, setOrderToProcess] = useState(null);
  const [orderToComplete, setOrderToComplete] = useState(null);

  // States to fix blank screen
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);
  
  // Products filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');

  // Navbar search state (separate from tab filter)
  const [navSearchQuery, setNavSearchQuery] = useState('');

  // Handle navbar search: navigate to products tab and apply search
  const handleNavSearch = (e) => {
    const value = e.target.value;
    setNavSearchQuery(value);
    setSearchQuery(value);
    if (value.trim().length > 0) {
      setActiveTab('products');
    }
  };

  const handleNavSearchKeyDown = (e) => {
    if (e.key === 'Enter' && navSearchQuery.trim().length > 0) {
      setActiveTab('products');
    }
  };

  // Interactive local states
  const [localOrders, setLocalOrders] = useState([]);
  const [sirkelScore, setSirkelScore] = useState(null);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Orders status filter
  const [orderFilter, setOrderFilter] = useState('all');

  // Order Detail Modal
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);

  // Patungan offer state
  const [activePatunganOffer, setActivePatunganOffer] = useState(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerNotes, setOfferNotes] = useState('');
  const [offerSubmitting, setOfferSubmitting] = useState(false);

  // Toast state (global success/error feedback)
  const [toast, setToast] = useState({ visible: false, type: 'success', message: '' });

  // Bulk Orders State
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  
  // Profile edit state
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ supplier_name: '', description: '', address: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  // Flash notifications auto-fade state
  const [showFlash, setShowFlash] = useState({ success: false, error: false });

  // Wallet Modal
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Shipping Modal
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [shippingForm, setShippingForm] = useState({ courier: '', tracking: '' });
  const [orderToShip, setOrderToShip] = useState(null);

  // Stock Ledger Modal
  const [isStockLedgerOpen, setIsStockLedgerOpen] = useState(false);
  const [selectedProductForLedger, setSelectedProductForLedger] = useState(null);

  // Bulk Upload Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // IMPORTANT: do NOT fall back to a hardcoded dummy supplier here.
  // Previously this defaulted to `{ id: 1, ... }` whenever `user.profile`
  // was missing/null, which silently submitted the WRONG supplier_id
  // (belonging to a different supplier account) and caused every write
  // action (e.g. creating a product) to fail with a 403 Unauthorized.
  const supplier = user?.profile || null;

  // Load data on mount
  useEffect(() => {
    const loadSupplierData = async () => {
      if (!supplier?.id) return;
      setIsLoading(true);
      try {
        await Promise.all([
          fetchProducts({ supplier_id: supplier.id, per_page: 100 }),
          fetchSupplierOrders(),
          fetchGroupBuyings(),
          fetchSupplierReviews(supplier.id).catch(err => console.error('Reviews error:', err)),
          sirkelScoreService.getSupplierSirkelScore(supplier.id).then(res => {
            if (res.success) setSirkelScore(res.data);
          }).catch(err => console.error('SirkelScore API error:', err)),
          fetchReviewSummary(supplier.id).then(res => {
            if (res) setReviewSummary(res);
          }).catch(err => console.error('AI Review Summary error:', err)),
          fetchWallet().catch(err => console.error('Wallet error:', err)),
          fetchAnalytics().catch(err => console.error('Analytics error:', err)),
        ]);
      } catch (err) {
        console.error('Error loading supplier data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSupplierData();
    // Init profile form
    if (supplier) {
      setProfileForm({
        supplier_name: supplier.supplier_name || '',
        description: supplier.description || '',
        address: supplier.address || '',
      });
    }
  }, [supplier?.id]);

  useEffect(() => {
    if (orders.length > 0) {
      const mapped = orders.map(o => {
        const d = new Date(o.created_at || Date.now());
        const formattedDate = `${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })} ${d.getFullYear()}`;
        return {
          id: `ORD-${String(o.id).padStart(5, '0')}`,
          rawId: o.id,
          customer: o.buyer?.name || 'UMKM Owner',
          product: o.product?.name || 'Bahan Baku',
          quantity: o.quantity,
          unit: o.product?.unit || '',
          notes: o.notes || '',
          date: formattedDate,
          total: o.total_price,
          status: o.status.charAt(0).toUpperCase() + o.status.slice(1)
        };
      });
      setLocalOrders(mapped);
    }
  }, [orders]);

  useEffect(() => {
    if (flash?.success) {
      setShowFlash(prev => ({ ...prev, success: true }));
      const timer = setTimeout(() => setShowFlash(prev => ({ ...prev, success: false })), 4000);
      return () => clearTimeout(timer);
    }
  }, [flash?.success]);

  useEffect(() => {
    if (flash?.error) {
      setShowFlash(prev => ({ ...prev, error: true }));
      const timer = setTimeout(() => setShowFlash(prev => ({ ...prev, error: false })), 4000);
      return () => clearTimeout(timer);
    }
  }, [flash?.error]);

  const currentSupplier = supplier || {
    supplier_name: user?.name || 'Supplier PJ',
    description: 'Penyedia bahan baku berkualitas untuk UMKM.',
    address: 'Alamat belum diisi.',
    verified: false,
    rating: 5.0
  };

  const [data, setDataState] = useState({
    name: '',
    category: 'Bahan Pangan',
    price: '',
    stock: '',
    unit: 'pcs',
    description: '',
    image: '',
    variants: [],
    tier_prices: [],
    weight: '',
    length: '',
    width: '',
    height: '',
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  const setData = (field, value) => {
    if (typeof field === 'object') {
      setDataState(prev => ({ ...prev, ...field }));
    } else {
      setDataState(prev => ({ ...prev, [field]: value }));
    }
  };

  const reset = () => {
    setDataState({
      name: '',
      category: 'Bahan Pangan',
      price: '',
      stock: '',
      unit: 'pcs',
      description: '',
      image: '',
      variants: [],
      tier_prices: [],
      weight: '',
      length: '',
      width: '',
      height: '',
    });
  };

  const clearErrors = () => {
    setErrors({});
  };

  const getIcon = (name) => {
    switch (name) {
      case 'Total Products': return Package;
      case 'Active Stock': return Layers;
      case 'Total Orders': return ShoppingCart;
      case 'Rating': return Star;
      default: return Package;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    clearErrors();
    reset();
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    clearErrors();
    setData({
      name: product.name,
      category: product.category,
      price: Math.round(product.price).toString(),
      stock: product.stock.toString(),
      unit: product.unit,
      description: product.description || '',
      image: product.image || '',
      variants: product.variants || [],
      tier_prices: product.tier_prices || [],
      weight: product.weight ? product.weight.toString() : '',
      length: product.length ? product.length.toString() : '',
      width: product.width ? product.width.toString() : '',
      height: product.height ? product.height.toString() : '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (product) => {
    setProductToDelete(product);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      try {
        await removeProduct(productToDelete.id);
        setToast({ visible: true, type: 'success', message: 'Produk berhasil dihapus.' });
        setProductToDelete(null);
      } catch (err) {
        setToast({ visible: true, type: 'error', message: err.response?.data?.message || 'Gagal menghapus produk.' });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplier?.id) {
      setToast({
        visible: true,
        type: 'error',
        message: 'Profil supplier belum termuat. Silakan muat ulang halaman atau login ulang sebelum menambah produk.'
      });
      return;
    }
    setProcessing(true);
    setErrors({});
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('category', data.category);
      formData.append('price', parseFloat(data.price));
      formData.append('stock', parseInt(data.stock));
      formData.append('unit', data.unit);
      formData.append('description', data.description || '');
      // NOTE: We deliberately do NOT send `supplier_id` here.
      // ProductController::store() already resolves it securely from
      // auth()->user()->supplierProfile when it's omitted. Sending it
      // from the client opened the door to mismatches (e.g. stale/cached
      // `user.profile` in localStorage) that caused 403 Unauthorized
      // errors even for the product's rightful owner. Letting the
      // backend derive it from the authenticated session removes that
      // entire class of bugs.

      if (data.image) {
        formData.append('image', data.image);
      }

      if (data.variants && data.variants.length > 0) {
        formData.append('variants', JSON.stringify(data.variants));
      }

      if (data.tier_prices && data.tier_prices.length > 0) {
        formData.append('tier_prices', JSON.stringify(data.tier_prices));
      }

      if (editingProduct) {
        await editProduct(editingProduct.id, formData);
        setToast({ visible: true, type: 'success', message: 'Produk berhasil diperbarui.' });
      } else {
        await addProduct(formData);
        setToast({ visible: true, type: 'success', message: 'Produk baru berhasil ditambahkan.' });
      }
      setIsModalOpen(false);
      reset();
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setToast({ visible: true, type: 'error', message: err.response?.data?.message || 'Gagal menyimpan produk.' });
      }
    } finally {
      setProcessing(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const numericId = parseInt(orderId.replace('ORD-', ''), 10);
    try {
      await changeStatus(numericId, newStatus.toLowerCase());
      setToast({ visible: true, type: 'success', message: `Status pesanan berhasil diubah menjadi ${newStatus}.` });
    } catch (err) {
      console.error(err);
      setToast({ visible: true, type: 'error', message: err.response?.data?.message || 'Gagal memperbarui status pesanan.' });
    }
  };

  const handleBulkUpdateStatus = async () => {
    if (!bulkStatus) {
      setToast({ visible: true, type: 'error', message: 'Pilih status terlebih dahulu.' });
      return;
    }
    
    try {
      await axios.post('/api/supplier-orders/bulk-status', {
        order_ids: selectedOrders,
        status: bulkStatus.toLowerCase()
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setToast({ visible: true, type: 'success', message: `${selectedOrders.length} pesanan berhasil diubah statusnya.` });
      setSelectedOrders([]);
      setIsBulkStatusModalOpen(false);
      setBulkStatus('');
      fetchSupplierOrders();
    } catch(err) {
      setToast({ visible: true, type: 'error', message: 'Gagal memperbarui status pesanan.' });
    }
  };

  const toggleSelectOrder = (id) => {
    if(selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter(oId => oId !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  const toggleSelectAllOrders = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.rawId));
    }
  };

  const fetchOrderDetail = async (orderId) => {
    setOrderDetailLoading(true);
    setIsOrderDetailOpen(true);
    try {
      const numericId = parseInt(orderId.replace('ORD-', ''), 10);
      // We don't have getOrder in useOrders, but we can fetch it via orderService if needed, or find in local state.
      // Since we added rawId in mapped orders, we can find it in 'orders' state.
      const orderData = localOrders.find(o => o.rawId === numericId);
      if(orderData) {
        setSelectedOrderDetail(orderData);
      } else {
        setToast({ visible: true, type: 'error', message: 'Detail pesanan tidak ditemukan.' });
        setIsOrderDetailOpen(false);
      }
    } catch(err) {
      setToast({ visible: true, type: 'error', message: 'Gagal memuat detail pesanan.' });
      setIsOrderDetailOpen(false);
    } finally {
      setOrderDetailLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setToast({ visible: true, type: 'error', message: 'Pilih file CSV terlebih dahulu.' });
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const res = await axios.post('/api/products/import', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setToast({ visible: true, type: 'success', message: `Berhasil import ${res.data.data.imported} produk. Gagal: ${res.data.data.failed}` });
      setIsUploadModalOpen(false);
      setUploadFile(null);
      fetchProducts({ supplier_id: supplier.id, per_page: 100 });
    } catch (err) {
      setToast({ visible: true, type: 'error', message: err.response?.data?.message || 'Gagal upload file.' });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!supplier?.id) {
      setToast({
        visible: true,
        type: 'error',
        message: 'Profil supplier belum termuat. Silakan muat ulang halaman atau login ulang.'
      });
      return;
    }
    setProfileSaving(true);
    try {
      await supplierService.updateSupplier(supplier.id, profileForm);
      setToast({ visible: true, type: 'success', message: 'Profil berhasil diperbarui.' });
    } catch(err) {
      setToast({ visible: true, type: 'error', message: err.response?.data?.message || 'Gagal memperbarui profil.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const submitOffer = async () => {
    if(!offerPrice || isNaN(offerPrice) || Number(offerPrice) <= 0) {
      setToast({ visible: true, type: 'error', message: 'Masukkan harga penawaran yang valid' });
      return;
    }
    setOfferSubmitting(true);
    try {
      await supplierOfferService.createOffer(activePatunganOffer.id, {
        price_per_unit: offerPrice,
        notes: offerNotes
      });
      setToast({ visible: true, type: 'success', message: `Penawaran harga ${formatPrice(offerPrice)} berhasil diajukan untuk patungan ${activePatunganOffer.product_name || activePatunganOffer.product?.name}! `});
      setActivePatunganOffer(null);
      setOfferPrice('');
      setOfferNotes('');
    } catch (err) {
      setToast({ visible: true, type: 'error', message: err.response?.data?.message || 'Gagal mengajukan penawaran.' });
    } finally {
      setOfferSubmitting(false);
    }
  };

  // Filtered products for products tab
  const filteredProducts = products.filter(prod => {
    const prodName = prod?.name || '';
    const prodCategory = prod?.category || '';
    const matchesSearch = prodName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prodCategory.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'Semua' || prodCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filtered orders for orders tab
  const filteredOrders = localOrders.filter(o => {
    if (orderFilter === 'all') return true;
    if (orderFilter === 'Pending') return o.status === 'Pending' || o.status === 'Paid';
    if (orderFilter === 'Processing') return o.status === 'Processing' || o.status === 'Shipped';
    return o.status === orderFilter;
  });

  // Calculate Review Metrics Dynamically
  const reviewMetrics = {
    average: reviews.length > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) : currentSupplier.rating ? Number(currentSupplier.rating).toFixed(1) : '0.0',
    total: reviews.length,
    distribution: [5, 4, 3, 2, 1].map(stars => {
      const count = reviews.filter(r => Math.round(r.rating) === stars).length;
      return {
        stars,
        count,
        percentage: reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0
      };
    }),
    items: reviews.length > 0 ? reviews.map(r => ({
      name: r.user?.name || 'UMKM Owner',
      date: new Date(r.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }),
      stars: r.rating,
      text: r.comment
    })) : [
      { name: 'SirkelBisnis Bot', date: new Date().toLocaleDateString('id-ID'), stars: 5, text: 'Belum ada ulasan untuk toko ini.' }
    ]
  };

  // Restock Prediction (Stok Menipis)
  const lowStockProducts = products.filter(p => p.stock <= 10);

  // Definitions for stats and logout handler to fix undefined variables
  const totalProducts = products.length;
  const activeStock = products.reduce((acc, curr) => acc + (curr.stock || 0), 0);
  const totalOrders = orders.length;
  const supplierRating = Number(currentSupplier.rating || 5.0).toFixed(1);

  const stats = [
    { name: 'Total Products', value: isLoading ? '...' : `${totalProducts} Produk`, change: 'Katalog aktif', changeType: 'normal' },
    { name: 'Active Stock', value: isLoading ? '...' : `${activeStock} Unit`, change: activeStock < 50 ? 'Stok menipis' : 'Stok melimpah', changeType: activeStock < 50 ? 'warning' : 'positive' },
    { name: 'Total Orders', value: isLoading ? '...' : `${totalOrders} Pesanan`, change: 'Total pesanan masuk', changeType: 'normal' },
    { name: 'Rating', value: isLoading ? '...' : supplierRating, change: `Skor Sirkel: ${sirkelScore?.score || currentSupplier.sirkel_score || 90}`, changeType: 'positive' }
  ];

  const handleLogout = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsLogoutConfirmOpen(true);
  };

  const performLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans antialiased text-[#1E293B]">
      {/* Sidebar for desktop and mobile */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#E2E8F0] bg-white px-5 py-6 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:fixed transition-transform duration-300 ease-in-out`}>
        <div className="flex-1 flex flex-col">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 mb-8 h-10 shrink-0">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="SirkelBisnis" className="h-10 w-10 rounded-xl object-cover object-top bg-white shadow-xs" />
              <div>
                <span className="font-bold text-lg tracking-tight text-[#0F172A]">Sirkel<span className="text-emerald-600">Bisnis</span></span>
                <p className="text-[10px] uppercase tracking-widest text-[#94A3B8] font-bold">Supplier Portal</p>
              </div>
            </div>
            <button className="lg:hidden text-[#64748B] hover:text-[#0F172A]" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Sidebar Menu Links */}
          <nav className="flex-1 min-h-0 overflow-y-auto space-y-1.5 px-1 pr-2">
            <button 
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${
                activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <Layers className="h-4.5 w-4.5" />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => { setActiveTab('products'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${
                activeTab === 'products' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <Package className="h-4.5 w-4.5" />
              <span>Kelola Produk</span>
            </button>
            <button 
              onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${
                activeTab === 'orders' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              <span>Kelola Pesanan</span>
            </button>
            <button 
              onClick={() => { setActiveTab('group-buying'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${
                activeTab === 'group-buying' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <Users className="h-4.5 w-4.5" />
              <span>Sirkel Patungan</span>
            </button>
            <button 
              onClick={() => { setActiveTab('reviews'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${
                activeTab === 'reviews' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <Star className="h-4.5 w-4.5" />
              <span>Ulasan & Rating</span>
            </button>
            <button 
              onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${
                activeTab === 'profile' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <User className="h-4.5 w-4.5" />
              <span>Profil Toko</span>
            </button>
            <button 
              onClick={() => { setActiveTab('invoices'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${
                activeTab === 'invoices' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <FileSpreadsheet className="h-4.5 w-4.5" />
              <span>Invoices B2B</span>
            </button>
            <button 
              onClick={() => { setActiveTab('chats'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${
                activeTab === 'chats' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <MessageCircle className="h-4.5 w-4.5" />
              <span>Direct Messaging</span>
            </button>
            <button 
              onClick={() => { setActiveTab('vouchers'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${
                activeTab === 'vouchers' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <Tag className="h-4.5 w-4.5" />
              <span>Promo & Voucher</span>
            </button>
            <button
              onClick={() => { setActiveTab('disputes'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                activeTab === 'disputes' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <ShieldAlert className="w-5 h-5" />
              Sengketa / RMA
            </button>

            <button
              onClick={() => { setActiveTab('crm'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                activeTab === 'crm' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <Users className="w-5 h-5" />
              CRM & Pelanggan
            </button>

            <button
              onClick={() => { setActiveTab('storefront'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                activeTab === 'storefront' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <Store className="w-5 h-5" />
              Pengaturan Toko
            </button>

            <button
              onClick={() => { setActiveTab('bank-accounts'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                activeTab === 'bank-accounts' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <Landmark className="w-5 h-5" />
              Rekening Bank
            </button>
            <button 
              onClick={() => { setActiveTab('wallet'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${
                activeTab === 'wallet' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <Wallet className="h-4.5 w-4.5" />
              <span>Keuangan</span>
            </button>
            <button 
              onClick={() => { setActiveTab('staff'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${
                activeTab === 'staff' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <Users className="h-4.5 w-4.5" />
              <span>Manajemen Staf</span>
            </button>
            <button 
              onClick={() => { setActiveTab('returns'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${
                activeTab === 'returns' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <Package className="h-4.5 w-4.5" />
              <span>Returns & RMA</span>
            </button>
            <button 
              onClick={() => { setActiveTab('procurement'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${
                activeTab === 'procurement' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <Truck className="h-4.5 w-4.5" />
              <span>Procurement (B2B)</span>
            </button>
            <button 
              onClick={() => { setActiveTab('advanced-b2b'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${
                activeTab === 'advanced-b2b' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >
              <TrendingUp className="h-4.5 w-4.5" />
              <span>Advanced B2B</span>
            </button>
          </nav>
        </div>


        {/* User Footer Profile */}
        <div className="border-t border-[#E2E8F0] pt-4 mt-auto shrink-0">
          <div className="flex items-center gap-3 px-2 py-1 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-sm shadow-sm">
              {currentSupplier.supplier_name.charAt(0)}
            </div>
            <div className="truncate">
              <p className="font-semibold text-xs text-[#0F172A] truncate max-w-[120px]">{currentSupplier.supplier_name}</p>
              <p className="text-[10px] text-[#64748B] truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-red-600 hover:bg-red-50 text-xs font-semibold transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Keluar Akun
          </button>
        </div>
      </aside>
      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white/80 backdrop-blur-md px-8 shadow-sm overflow-visible">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-[#64748B] hover:text-[#0F172A]" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            {/* SEARCH BAR */}
            <div className="relative w-80 hidden sm:block">
              <Search className="absolute top-2.5 left-3.5 h-4.5 w-4.5 text-[#94A3B8] pointer-events-none" />
              <input 
                type="text" 
                placeholder="Cari produk, sirkel patungan..."
                value={navSearchQuery}
                onChange={handleNavSearch}
                onKeyDown={handleNavSearchKeyDown}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-2 pl-10 pr-4 text-xs font-medium outline-none transition-all duration-200 focus:border-[#16A34A] focus:bg-white focus:ring-1 focus:ring-[#16A34A]/25"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative rounded-xl border border-[#E2E8F0] p-2.5 text-[#64748B] transition-all hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                title="Notifikasi"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                  
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl ring-1 ring-[#0F172A]/5 z-50 overflow-hidden" style={{ maxHeight: 'calc(100vh - 80px)' }}>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[#F1F5F9] px-4 py-3 bg-white sticky top-0 z-10">
                      <span className="font-bold text-sm text-[#0F172A] flex items-center gap-1.5">
                        <Bell className="h-4 w-4 text-[#16A34A]" />
                        <span>Notifikasi {unreadCount > 0 && <span className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white">{unreadCount}</span>}</span>
                      </span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-[10px] font-bold text-[#16A34A] hover:underline hover:text-[#15803D]"
                        >
                          Tandai semua dibaca
                        </button>
                      )}
                    </div>

                    {/* Scrollable notification list */}
                    <div className="overflow-y-auto" style={{ maxHeight: '360px' }}>
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                          <Bell className="h-8 w-8 text-[#CBD5E1] mb-2" />
                          <p className="text-[#94A3B8] text-xs font-semibold">Tidak ada notifikasi.</p>
                          <p className="text-[#CBD5E1] text-[10px] mt-0.5">Anda sudah up to date!</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-[#F1F5F9]">
                          {notifications.map((notif) => {
                            const NotifIcon = notif.type === 'order' ? ShoppingCart : notif.type === 'patungan' ? Users : CheckCircle;
                            
                            return (
                              <div 
                                key={notif.id}
                                onClick={() => { 
                                  markAsRead(notif.id); 
                                  if (notif.type === 'order') setActiveTab('orders'); 
                                  if (notif.type === 'patungan') setActiveTab('group-buying'); 
                                  setIsNotificationsOpen(false); 
                                }}
                                className={`flex gap-3 px-4 py-3.5 cursor-pointer transition-colors ${!notif.read ? 'bg-green-50/40 hover:bg-green-50/60' : 'hover:bg-[#F8FAFC]'}`}
                              >
                                {/* Icon */}
                                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${!notif.read ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                  <NotifIcon size={13} />
                                </div>
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className={`text-xs leading-snug ${!notif.read ? 'font-bold text-[#0F172A]' : 'font-medium text-[#64748B]'}`}>{notif.title}</span>
                                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                                      <span className="text-[9px] text-[#94A3B8] font-medium whitespace-nowrap">{notif.time}</span>
                                      {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] shrink-0"></span>}
                                    </div>
                                  </div>
                                  <p className={`text-xs leading-relaxed mt-0.5 ${!notif.read ? 'text-[#334155]' : 'text-[#94A3B8]'}`}>{notif.message}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-3 border-l border-[#E2E8F0] pl-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-green-50 to-green-100 text-[#16A34A] font-bold text-xs">
                {currentSupplier.supplier_name.charAt(0)}
              </div>
              <div className="text-left hidden md:block">
                <p className="font-semibold text-xs text-[#0F172A]">{currentSupplier.supplier_name}</p>
                <p className="text-[10px] text-[#22C55E] font-medium tracking-wide uppercase">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <main className="p-6 md:p-8 space-y-6 w-full flex-1">
          {/* Global Toast Feedback Banner */}
          {toast.visible && (
            <div className={`border-l-4 p-4 rounded-r-lg shadow-sm flex items-center justify-between animate-fadeIn mb-6 ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-600' : 'bg-rose-50 border-rose-600'}`}>
              <div className="flex items-center gap-3">
                {toast.type === 'success' ? <CheckCircle className="text-emerald-600" size={20} /> : <AlertTriangle className="text-rose-600" size={20} />}
                <span className={`text-sm font-semibold ${toast.type === 'success' ? 'text-emerald-800' : 'text-rose-800'}`}>{toast.message}</span>
              </div>
              <button onClick={() => setToast(prev => ({ ...prev, visible: false }))} className={`${toast.type === 'success' ? 'text-emerald-500 hover:text-emerald-700' : 'text-rose-500 hover:text-rose-700'}`}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Profile Panel */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
                <div className="space-y-1">
                  <h1 className="font-bold text-2xl tracking-tight text-[#0F172A] sm:text-3xl">
                    Selamat Datang, {currentSupplier.supplier_name}
                  </h1>
                  <div className="flex items-center gap-2.5 flex-wrap pt-1.5">
                    {currentSupplier.verified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle size={10} />
                        <span>Terverifikasi</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <Clock size={10} />
                        <span>Menunggu Verifikasi</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      <Star className="h-3 w-3 fill-current text-amber-500" />
                      <span>{Number(currentSupplier.rating || 5.0).toFixed(1)}</span>
                    </span>
                    <span className="text-xs text-[#64748B] flex items-center gap-1"><MapPin size={12} /> {currentSupplier.address}</span>
                  </div>
                  <p className="text-sm text-[#64748B] pt-0.5">
                    {currentSupplier.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5 shrink-0 self-start md:self-center">
                  <button 
                    onClick={openAddModal} 
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4.5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Produk Baru
                  </button>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => {
                  const Icon = getIcon(stat.name);
                  return (
                    <div 
                      key={i} 
                      className="group flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm hover:border-slate-300 transition duration-150"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">{stat.name === 'Total Products' ? 'Total Produk' : stat.name === 'Active Stock' ? 'Stok Aktif' : stat.name === 'Total Orders' ? 'Total Pesanan' : stat.name}</span>
                        <p className="text-2xl font-bold text-[#0F172A] tracking-tight">{stat.value}</p>
                        <p className={`text-[10px] font-semibold ${
                          stat.changeType === 'positive' ? 'text-emerald-600' : 
                          stat.changeType === 'warning' ? 'text-amber-600' : 'text-[#64748B]'
                        }`}>
                          {stat.change}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SECTION 3: ANALYTICS DASHBOARD */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Trend (2/3) */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full min-h-[350px]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <TrendingUp className="text-emerald-600" size={20} />
                      Tren Penjualan (6 Bulan Terakhir)
                    </h3>
                  </div>
                  {analyticsLoading ? (
                    <div className="flex-1 bg-slate-100 rounded-xl animate-pulse"></div>
                  ) : (
                    <div className="flex-1 flex items-end justify-between gap-2 pt-4">
                      {analytics.sales_trend?.slice().reverse().map((data, idx) => {
                        const maxSales = Math.max(...analytics.sales_trend.map(d => d.total));
                        const height = maxSales > 0 ? (data.total / maxSales) * 100 : 0;
                        return (
                          <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                            <div className="relative w-full flex justify-center h-[200px] items-end">
                              <div 
                                className="w-12 bg-emerald-100 hover:bg-emerald-200 rounded-t-lg transition-all relative overflow-hidden"
                                style={{ height: `${Math.max(height, 5)}%` }}
                              >
                                <div className="absolute bottom-0 w-full bg-emerald-500 rounded-t-lg transition-all" style={{ height: '100%' }}></div>
                              </div>
                              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                                {formatPrice(data.total)}
                              </div>
                            </div>
                            <span className="text-xs text-slate-500 font-semibold">{data.month.split(' ')[0]}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Top Products (1/3) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full min-h-[350px]">
                  <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
                    <Star className="text-amber-500 fill-amber-500" size={20} />
                    Produk Terlaris
                  </h3>
                  {analyticsLoading ? (
                    <div className="flex-1 bg-slate-100 rounded-xl animate-pulse"></div>
                  ) : (
                    <div className="space-y-4 flex-1 overflow-auto">
                      {analytics.top_products?.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm font-medium">Belum ada data penjualan.</div>
                      ) : (
                        analytics.top_products?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                              {item.product?.image ? (
                                <img src={`/storage/${item.product.image}`} alt={item.product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <Package size={20} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 text-sm truncate">{item.product?.name}</p>
                              <p className="text-xs text-slate-500 font-medium">{item.total_sold} Terjual</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 4: INSIGHTS & WARNINGS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Review Summary */}
                <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 text-slate-100 shadow-md flex flex-col relative overflow-hidden h-full">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-2 rounded-full bg-slate-800 border border-slate-700/50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider w-fit text-emerald-400">
                      <Sparkles className="h-4 w-4" />
                      AI Review Insight
                    </div>
                    <h2 className="text-xl font-bold leading-tight tracking-tight text-white">
                      Ringkasan Ulasan Pelanggan
                    </h2>
                    {isLoading ? (
                      <div className="space-y-2 animate-pulse mt-4">
                        <div className="h-4 bg-slate-700 rounded w-full"></div>
                        <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                        <div className="h-4 bg-slate-700 rounded w-4/6"></div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-300 leading-relaxed font-medium">
                        {reviewSummary?.summary || "Belum ada cukup ulasan untuk menghasilkan ringkasan otomatis."}
                      </p>
                    )}
                  </div>
                </div>

                {/* Low Stock Warning */}
                <div className={`rounded-3xl border p-8 shadow-md flex flex-col justify-between gap-6 relative overflow-hidden h-full ${lowStockProducts.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                  <div className="space-y-4">
                    <div className={`flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-bold uppercase tracking-wider w-fit ${lowStockProducts.length > 0 ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                      <AlertTriangle className="h-4 w-4" />
                      Status Inventaris
                    </div>
                    <h2 className={`text-xl font-bold leading-tight tracking-tight ${lowStockProducts.length > 0 ? 'text-amber-900' : 'text-slate-800'}`}>
                      {lowStockProducts.length > 0 ? `${lowStockProducts.length} Produk Menipis` : 'Stok Produk Aman'}
                    </h2>
                    <p className={`text-sm leading-relaxed font-medium ${lowStockProducts.length > 0 ? 'text-amber-800' : 'text-slate-500'}`}>
                      {lowStockProducts.length > 0 
                        ? "Beberapa produk Anda memiliki stok kurang dari 10 unit. Segera restock untuk menghindari kehilangan pesanan dari UMKM." 
                        : "Semua produk dalam katalog Anda memiliki stok yang mencukupi untuk memenuhi pesanan UMKM."}
                    </p>
                  </div>
                  {lowStockProducts.length > 0 && (
                    <button 
                      onClick={() => setActiveTab('products')} 
                      className="rounded-2xl bg-amber-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-amber-700 transition-all flex items-center justify-center gap-2 w-fit"
                    >
                      Kelola Stok
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Dual Column Layout (Products & Group Buying Preview) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Product List Overview (2/3 width) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:col-span-2 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold tracking-tight text-slate-900">Produk Terbaru</h3>
                      <button onClick={() => setActiveTab('products')} className="text-emerald-600 hover:text-emerald-700 font-bold text-xs flex items-center gap-0.5">
                        <span>Lihat Semua</span>
                        <ArrowUpRight size={14} />
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50 text-xs uppercase tracking-wider">
                            <th className="py-3 px-4">Nama Produk</th>
                            <th className="py-3 px-4">Kategori</th>
                            <th className="py-3 px-4 text-right">Harga</th>
                            <th className="py-3 px-4 text-center">Stok</th>
                            <th className="py-3 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="py-8 text-center text-slate-400 font-semibold bg-slate-50/20">
                                Belum ada produk.
                              </td>
                            </tr>
                          ) : (
                            products.slice(0, 5).map((prod) => {
                              const isLowStock = prod.stock > 0 && prod.stock <= 10;
                              const isOutOfStock = prod.stock === 0;
                              return (
                                <tr key={prod.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                                  <td className="py-3.5 px-4 font-bold text-slate-800">{prod.name}</td>
                                  <td className="py-3.5 px-4 text-slate-500">{prod.category}</td>
                                  <td className="py-3.5 px-4 text-right text-slate-800 font-bold">{formatPrice(prod.price)}</td>
                                  <td className="py-3.5 px-4 text-center text-slate-500 font-semibold">{prod.stock} {prod.unit}</td>
                                  <td className="py-3.5 px-4 text-center">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                      isOutOfStock ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                      isLowStock ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}>
                                      {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'Instock'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Group Buying Overview Preview (1/3 width) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold tracking-tight text-slate-900">Peluang Patungan</h3>
                    <button onClick={() => setActiveTab('group-buying')} className="text-emerald-600 hover:text-emerald-700 font-bold text-xs flex items-center gap-0.5">
                      <span>Lihat Semua</span>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>

                  <div className="space-y-4 flex-1">
                    {gbLoading ? (
                      Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-3 animate-pulse">
                          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                          <div className="h-px bg-slate-200/80 my-2"></div>
                          <div className="flex justify-between items-center">
                            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
                          </div>
                        </div>
                      ))
                    ) : groupBuyings.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 font-semibold bg-slate-50/50 rounded-xl border border-slate-200">
                        Belum ada sirkel patungan aktif.
                      </div>
                    ) : (
                      groupBuyings.slice(0, 2).map((group) => (
                        <div key={group.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{group.product_name || group.product?.name}</p>
                            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-semibold">
                              <span className="flex items-center gap-1"><Users size={12} /> {group.participant_count || 0} UMKM</span>
                              <span>Bahan Baku: {group.target_quantity}</span>
                            </div>
                          </div>
                          <div className="h-px bg-slate-200/80"></div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Potensi Omzet</p>
                              {/* If no revenue property, estimate based on product price or default */}
                              <p className="font-bold text-emerald-600 text-sm">{formatPrice(group.revenue || (group.target_quantity * (group.product?.price || 15000)))}</p>
                            </div>
                            <button 
                              onClick={() => { setActivePatunganOffer(group); setOfferPrice(group.product?.price?.toString() || ''); }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                            >
                              Tawarkan
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold tracking-tight text-slate-900">Pesanan Terbaru</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-emerald-600 hover:text-emerald-700 font-bold text-xs flex items-center gap-0.5">
                    <span>Kelola Pesanan</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50 text-xs uppercase tracking-wider">
                        <th className="py-3 px-4">ID Pesanan</th>
                        <th className="py-3 px-4">Nama Pembeli (UMKM)</th>
                        <th className="py-3 px-4">Tanggal Masuk</th>
                        <th className="py-3 px-4 text-right">Total Transaksi</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localOrders.slice(0, 3).map((ord) => {
                        const isCompleted = ord.status === 'Completed';
                        const isProcessing = ord.status === 'Processing';
                        const StatusIcon = isCompleted ? CheckCircle : isProcessing ? AlertTriangle : Clock;
                        return (
                          <tr key={ord.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{ord.id}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-800">{ord.customer}</td>
                            <td className="py-3.5 px-4 text-slate-500 font-medium">{ord.date}</td>
                            <td className="py-3.5 px-4 text-right text-slate-800 font-bold">{formatPrice(ord.total)}</td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                isProcessing ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                <StatusIcon size={12} />
                                <span>{ord.status}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KELOLA PRODUK */}
          {activeTab === 'products' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kelola Katalog Produk</h1>
                  <p className="text-slate-500 text-sm">Tambahkan, ubah, dan pantau stok aktif katalog produk supplier Anda.</p>
                </div>
                <div className="flex gap-2 self-start sm:self-center">
                  <button 
                    onClick={() => setIsUploadModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold shadow-sm transition-all text-sm"
                  >
                    <Upload size={16} />
                    <span>Upload CSV</span>
                  </button>
                  <button 
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-all text-sm"
                  >
                    <Plus size={16} />
                    <span>Tambah Produk Baru</span>
                  </button>
                </div>
              </div>

              {/* Nav Search Active Indicator */}
              {navSearchQuery && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between shadow-sm animate-fadeIn">
                  <span className="text-emerald-800 text-sm font-semibold flex items-center gap-2">
                    <Search size={16} />
                    Menampilkan hasil pencarian untuk: <span className="font-bold italic">"{navSearchQuery}"</span>
                  </span>
                  <button 
                    onClick={() => { setNavSearchQuery(''); setSearchQuery(''); }}
                    className="text-emerald-600 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    Hapus Pencarian
                  </button>
                </div>
              )}

              {/* Filters Panel */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Cari produk berdasarkan nama..."
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setNavSearchQuery(e.target.value); }}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-800"
                  />
                </div>
                
                {/* Category select filter */}
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-400 shrink-0" />
                  <select 
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white font-semibold text-slate-700"
                  >
                    <option value="Semua">Semua Kategori</option>
                    <option value="Bahan Pangan">Bahan Pangan</option>
                    <option value="Kemasan">Kemasan</option>
                    <option value="Bumbu Dapur">Bumbu Dapur</option>
                    <option value="Alat Tulis">Alat Tulis</option>
                    <option value="Peralatan">Peralatan</option>
                    <option value="Elektronik">Elektronik</option>
                  </select>
                </div>

                <div className="text-slate-400 text-xs font-bold uppercase md:ml-auto">
                  {filteredProducts.length} produk ditemukan
                </div>
              </div>

              {/* Main Products List Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50 text-xs uppercase tracking-wider">
                        <th className="py-3.5 px-6">Nama Produk</th>
                        <th className="py-3.5 px-6">Kategori</th>
                        <th className="py-3.5 px-6 text-right">Harga Satuan</th>
                        <th className="py-3.5 px-6 text-center">Stok</th>
                        <th className="py-3.5 px-6 text-center">Status Stok</th>
                        <th className="py-3.5 px-6 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-400 font-semibold bg-slate-50/10">
                            Tidak menemukan produk yang cocok dengan pencarian Anda.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((prod) => {
                          const isLowStock = prod.stock > 0 && prod.stock <= 10;
                          const isOutOfStock = prod.stock === 0;
                          
                          return (
                            <tr key={prod.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                              <td className="py-4 px-6">
                                <div>
                                  <p className="font-bold text-slate-800">{prod.name}</p>
                                  {prod.description && <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{prod.description}</p>}
                                </div>
                              </td>
                              <td className="py-4 px-6 text-slate-500 font-medium">{prod.category}</td>
                              <td className="py-4 px-6 text-right text-slate-800 font-bold">{formatPrice(prod.price)}</td>
                              <td className="py-4 px-6 text-center text-slate-500 font-semibold">{prod.stock} {prod.unit}</td>
                              <td className="py-4 px-6 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                  isOutOfStock ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                  isLowStock ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'Instock'}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center justify-center gap-3">
                                  <button 
                                    onClick={() => {
                                      setSelectedProductForLedger(prod);
                                      setIsStockLedgerOpen(true);
                                      fetchLedgers(prod.id);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Riwayat Stok"
                                  >
                                    <FileText size={16} />
                                  </button>
                                  <button 
                                    onClick={() => openEditModal(prod)}
                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Edit Produk"
                                  >
                                    <Edit3 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(prod)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Hapus Produk"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KELOLA PESANAN */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kelola Pesanan Masuk</h1>
                <p className="text-slate-500 text-sm">Lihat detail pesanan bahan baku dari UMKM mitra dan perbarui status pengerjaannya.</p>
              </div>

              {/* Order status filters */}
              <div className="flex border-b border-slate-200 bg-white p-2 rounded-xl border shadow-sm gap-2">
                {[
                  { key: 'all', label: 'Semua Pesanan' },
                  { key: 'Pending', label: 'Menunggu Konfirmasi' },
                  { key: 'Processing', label: 'Sedang Diproses' },
                  { key: 'Completed', label: 'Selesai Dikirim' }
                ].map(t => (
                  <button 
                    key={t.key}
                    onClick={() => setOrderFilter(t.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      orderFilter === t.key 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {selectedOrders.length > 0 && (
                  <div className="bg-indigo-50 border-b border-indigo-100 p-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-indigo-800">{selectedOrders.length} Pesanan Dipilih</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsBulkStatusModalOpen(true)}
                        className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700"
                      >
                        Ubah Status Massal
                      </button>
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50 text-xs uppercase tracking-wider">
                        <th className="py-3.5 px-4 w-10">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                            onChange={toggleSelectAllOrders}
                          />
                        </th>
                        <th className="py-3.5 px-6">ID Pesanan</th>
                        <th className="py-3.5 px-6">Pelanggan UMKM</th>
                        <th className="py-3.5 px-6">Tanggal Masuk</th>
                        <th className="py-3.5 px-6 text-right">Total Transaksi</th>
                        <th className="py-3.5 px-6 text-center">Status Pembayaran</th>
                        <th className="py-3.5 px-6 text-center">Aksi / Kontrol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-400 font-semibold bg-slate-50/10">
                            Tidak ada pesanan dengan status terpilih.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((ord) => {
                          const isCompleted = ord.status === 'Completed';
                          const isProcessing = ord.status === 'Processing' || ord.status === 'Shipped';
                          const isPending = ord.status === 'Pending' || ord.status === 'Paid';
                          const StatusIcon = isCompleted ? CheckCircle : isProcessing ? AlertTriangle : (ord.status === 'Paid' ? CheckCircle : Clock);
                          
                          return (
                            <tr key={ord.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                              <td className="py-4 px-4 text-center">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  checked={selectedOrders.includes(ord.rawId)}
                                  onChange={() => toggleSelectOrder(ord.rawId)}
                                />
                              </td>
                              <td className="py-4 px-6 font-mono font-bold text-slate-600">{ord.id}</td>
                              <td className="py-4 px-6">
                                <p className="font-bold text-slate-800">{ord.customer}</p>
                                <p className="text-xs text-slate-400">Bandung Barat, ID</p>
                              </td>
                              <td className="py-4 px-6 text-slate-500 font-medium">{ord.date}</td>
                              <td className="py-4 px-6 text-right text-slate-800 font-bold">{formatPrice(ord.total)}</td>
                              <td className="py-4 px-6 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                  isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  isProcessing ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                  ord.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  <StatusIcon size={12} />
                                  <span>{ord.status}</span>
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => fetchOrderDetail(ord.id)}
                                    className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold shadow-sm transition-all"
                                  >
                                    Detail
                                  </button>
                                  {isPending && (
                                    <button 
                                      onClick={() => setOrderToProcess(ord)}
                                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                    >
                                      Proses Pesanan
                                    </button>
                                  )}
                                  {ord.status === 'Processing' && (
                                    <button 
                                      onClick={() => { setOrderToShip(ord); setIsShippingModalOpen(true); }}
                                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                                    >
                                      <Truck size={14} /> Kirim Pesanan
                                    </button>
                                  )}
                                  {ord.status === 'Shipped' && (
                                    <button 
                                      onClick={() => setOrderToComplete(ord)}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                    >
                                      Tandai Selesai
                                    </button>
                                  )}
                                  {isCompleted && (
                                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                                      <Check size={14} className="text-emerald-500" /> Transaksi Selesai
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SIRKEL PATUNGAN */}
          {activeTab === 'group-buying' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sirkel Patungan (Group Buying) UMKM</h1>
                <p className="text-slate-500 text-sm">Lihat kumpulan permintaan patungan bahan baku dari aliansi UMKM. Tawarkan harga terbaik Anda untuk memenangkan pasokan!</p>
              </div>

              {/* Grid of opportunities */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gbLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4 animate-pulse">
                      <div className="space-y-2">
                        <div className="flex justify-between"><div className="h-4 bg-slate-200 rounded w-16"></div><div className="h-3 bg-slate-200 rounded w-20"></div></div>
                        <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-8 bg-slate-200 rounded w-full"></div>
                      </div>
                      <div className="h-10 bg-slate-200 rounded-lg w-full mt-2"></div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))
                ) : groupBuyings.length === 0 ? (
                  <div className="col-span-full p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                    <Users size={32} className="mx-auto text-slate-300 mb-2" />
                    <h3 className="font-bold text-slate-700">Belum Ada Patungan</h3>
                    <p className="text-sm text-slate-500">Belum ada permintaan patungan bahan baku dari UMKM saat ini.</p>
                  </div>
                ) : (
                  groupBuyings.map((group) => (
                    <div key={group.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4 hover:shadow-md transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                            {new Date(group.deadline).toLocaleDateString('id-ID')}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">Batas Penawaran</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-base">{group.product_name || group.product?.name}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          Aliansi UMKM Kuliner sedang melakukan patungan untuk memenuhi kebutuhan produksi. Ajukan harga penawaran Anda sekarang!
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between text-xs text-slate-600 font-semibold border border-slate-100">
                        <span className="flex items-center gap-1"><Users size={14} /> {group.participant_count || 0} UMKM Tergabung</span>
                        <span>Total Kebutuhan: {group.target_quantity}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimasi Omzet</p>
                          <p className="font-extrabold text-emerald-600 text-base">{formatPrice(group.revenue || (group.target_quantity * (group.product?.price || 15000)))}</p>
                        </div>
                        <button 
                          onClick={() => { setActivePatunganOffer(group); setOfferPrice(group.product?.price?.toString() || ''); }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                        >
                          Tawarkan Harga
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ULASAN & RATING */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ulasan & Rating Toko</h1>
                <p className="text-slate-500 text-sm">Lihat ulasan kepuasan dari UMKM mitra pembeli untuk mengevaluasi pelayanan Anda.</p>
              </div>

              {/* Summary of reviews */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score panel */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-2">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Rating Toko Anda</p>
                  <p className="text-5xl font-extrabold text-slate-900 tracking-tight">{reviewMetrics.average}</p>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="fill-amber-500" size={20} />
                    <Star className="fill-amber-500" size={20} />
                    <Star className="fill-amber-500" size={20} />
                    <Star className="fill-amber-500" size={20} />
                    <Star className={reviewMetrics.average >= 4.5 ? "fill-amber-500" : ""} size={20} />
                  </div>
                  <p className="text-xs text-slate-500 font-semibold">Berdasarkan {reviewMetrics.total} rating pelanggan</p>
                </div>

                {/* Stars distribution */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2 space-y-2.5">
                  <h4 className="text-sm font-bold text-slate-800">Distribusi Rating Bintang</h4>
                  <div className="space-y-2">
                    {reviewMetrics.distribution.map((d) => (
                      <div key={d.stars} className="flex items-center gap-3 text-xs">
                        <span className="w-12 text-slate-500 font-semibold">{d.stars} Bintang</span>
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400" style={{ width: `${d.percentage}%` }}></div>
                        </div>
                        <span className="w-8 text-right text-slate-500 font-bold">{d.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detailed reviews list */}
              <div className="space-y-4">
                <h4 className="text-base font-bold text-slate-800">Feedback Tertulis Mitra</h4>
                {reviewsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-12 bg-slate-200 rounded w-full"></div>
                      </div>
                    ))}
                  </div>
                ) : reviewMetrics.items.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-white border border-slate-200 rounded-xl shadow-sm">
                    Belum ada ulasan untuk toko Anda.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reviewMetrics.items.map((r, idx) => (
                      <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-bold text-slate-800 text-sm">{r.name}</h5>
                            <span className="text-[10px] text-slate-400 font-semibold">{r.date}</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {Array.from({ length: r.stars }).map((_, i) => (
                              <Star key={i} className="fill-amber-500" size={14} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">"{r.text}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: PROFIL TOKO */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profil Toko Supplier</h1>
                <p className="text-slate-500 text-sm">Kelola informasi toko Anda agar mudah dikenali oleh mitra UMKM.</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-w-3xl">
                <form onSubmit={handleUpdateProfile} className="p-6 md:p-8 space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Nama Toko / Perusahaan</label>
                    <input 
                      type="text" 
                      value={profileForm.supplier_name} 
                      onChange={e => setProfileForm({...profileForm, supplier_name: e.target.value})} 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Deskripsi Singkat</label>
                    <textarea 
                      value={profileForm.description} 
                      onChange={e => setProfileForm({...profileForm, description: e.target.value})} 
                      rows={4}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Alamat Lengkap Gudang/Toko</label>
                    <textarea 
                      value={profileForm.address} 
                      onChange={e => setProfileForm({...profileForm, address: e.target.value})} 
                      rows={3}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                    />
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
                    <button 
                      type="submit" 
                      disabled={profileSaving}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                    >
                      {profileSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* NEW TABS */}
          {activeTab === 'invoices' && <InvoicesTab setToast={setToast} />}
          {activeTab === 'chats' && <ChatTab setToast={setToast} user={user} />}
          {activeTab === 'vouchers' && <VoucherTab setToast={setToast} />}
          {activeTab === 'disputes' && <DisputeTab setToast={setToast} />}
          {activeTab === 'crm' && <CrmTab setToast={setToast} />}
          {activeTab === 'storefront' && <StorefrontTab setToast={setToast} />}
          {activeTab === 'bank-accounts' && <BankAccountsTab setToast={setToast} />}

          {/* TAB 7: KEUANGAN */}
          {activeTab === 'wallet' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Keuangan Toko</h1>
                <p className="text-slate-500 text-sm">Kelola saldo pendapatan dan tarik dana ke rekening Anda.</p>
              </div>

              {walletLoading ? (
                <div className="h-64 bg-slate-100 animate-pulse rounded-xl"></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Balance Card */}
                  <div className="col-span-1 md:col-span-1 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                      <Wallet size={80} />
                    </div>
                    <div className="relative z-10">
                      <p className="text-emerald-100 font-semibold mb-2 flex items-center gap-2"><DollarSign size={18} /> Saldo Aktif</p>
                      <h2 className="text-3xl font-bold mb-6">{formatPrice(wallet.balance || 0)}</h2>
                      
                      <button 
                        onClick={() => setIsWithdrawModalOpen(true)}
                        disabled={!wallet.balance || wallet.balance < 10000}
                        className="w-full bg-white text-emerald-700 hover:bg-emerald-50 px-4 py-3 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Tarik Dana
                      </button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-emerald-500/30 relative z-10 flex justify-between items-center">
                      <p className="text-emerald-100 text-sm">Tertunda (Dalam Proses)</p>
                      <p className="font-bold">{formatPrice(wallet.pending_balance || 0)}</p>
                    </div>
                  </div>

                  {/* Transaction History */}
                  <div className="col-span-1 md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[400px]">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800">Riwayat Transaksi</h3>
                    </div>
                    <div className="flex-1 overflow-auto p-5">
                      {!wallet.transactions || wallet.transactions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                          <Activity size={40} className="text-slate-200" />
                          <p>Belum ada transaksi keuangan.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {wallet.transactions.map((trx, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trx.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                  {trx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowRight size={20} className="rotate-45" />}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800 text-sm">{trx.description || (trx.type === 'income' ? 'Pendapatan Pesanan' : 'Penarikan Dana')}</p>
                                  <p className="text-xs text-slate-500">{new Date(trx.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`font-bold ${trx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                  {trx.type === 'income' ? '+' : '-'}{formatPrice(trx.amount)}
                                </p>
                                <p className="text-xs text-slate-500 capitalize">{trx.status}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'invoices' && <InvoicesTab setToast={setToast} />}
          {activeTab === 'chats' && <ChatTab setToast={setToast} user={user} />}
          {activeTab === 'vouchers' && <VoucherTab setToast={setToast} />}
          {activeTab === 'disputes' && <DisputeTab setToast={setToast} />}
          {activeTab === 'crm' && <CrmTab setToast={setToast} />}
          {activeTab === 'storefront' && <StorefrontTab setToast={setToast} />}
          {activeTab === 'bank-accounts' && <BankAccountsTab setToast={setToast} />}
          {activeTab === 'staff' && <StaffTab setToast={setToast} />}
          {activeTab === 'returns' && <ReturnsTab setToast={setToast} />}
          {activeTab === 'procurement' && <ProcurementTab setToast={setToast} />}
          {activeTab === 'advanced-b2b' && <AdvancedB2bTab setToast={setToast} />}
        </main>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Nama Produk</label>
                <input 
                  type="text" 
                  value={data.name} 
                  onChange={e => setData('name', e.target.value)} 
                  placeholder="Contoh: Cabai Merah Keriting"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  required
                />
                {errors.name && <span className="text-xs text-rose-500 font-bold">{errors.name}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Kategori</label>
                  <select 
                    value={data.category} 
                    onChange={e => setData('category', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white font-medium"
                    required
                  >
                    <option value="Bahan Pangan">Bahan Pangan</option>
                    <option value="Kemasan">Kemasan</option>
                    <option value="Bumbu Dapur">Bumbu Dapur</option>
                    <option value="Alat Tulis">Alat Tulis</option>
                    <option value="Peralatan">Peralatan</option>
                    <option value="Elektronik">Elektronik</option>
                  </select>
                  {errors.category && <span className="text-xs text-rose-500 font-bold">{errors.category}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Satuan (Unit)</label>
                  <select 
                    value={data.unit} 
                    onChange={e => setData('unit', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white font-medium"
                    required
                  >
                    <option value="pcs">pcs (pieces)</option>
                    <option value="kg">kg (kilogram)</option>
                    <option value="liter">liter</option>
                    <option value="box">box</option>
                    <option value="pack">pack</option>
                    <option value="karung">karung</option>
                  </select>
                  {errors.unit && <span className="text-xs text-rose-500 font-bold">{errors.unit}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Harga (Rp)</label>
                  <input 
                    type="number" 
                    value={data.price} 
                    onChange={e => setData('price', e.target.value)} 
                    placeholder="32000"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                    required
                    min="0"
                  />
                  {errors.price && <span className="text-xs text-rose-500 font-bold">{errors.price}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Jumlah Stok</label>
                  <input 
                    type="number" 
                    value={data.stock} 
                    onChange={e => setData('stock', e.target.value)} 
                    placeholder="100"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                    required
                    min="0"
                  />
                  {errors.stock && <span className="text-xs text-rose-500 font-bold">{errors.stock}</span>}
                </div>
              </div>

              {/* Logistics Section */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Berat (gram)</label>
                  <input 
                    type="number" 
                    value={data.weight} 
                    onChange={e => setData('weight', e.target.value)} 
                    placeholder="1000"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                    min="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Panjang (cm)</label>
                  <input 
                    type="number" 
                    value={data.length} 
                    onChange={e => setData('length', e.target.value)} 
                    placeholder="10"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                    min="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Lebar (cm)</label>
                  <input 
                    type="number" 
                    value={data.width} 
                    onChange={e => setData('width', e.target.value)} 
                    placeholder="10"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                    min="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tinggi (cm)</label>
                  <input 
                    type="number" 
                    value={data.height} 
                    onChange={e => setData('height', e.target.value)} 
                    placeholder="10"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Deskripsi</label>
                <textarea 
                  value={data.description} 
                  onChange={e => setData('description', e.target.value)} 
                  placeholder="Tulis detail deskripsi produk..."
                  rows={3}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
                {errors.description && <span className="text-xs text-rose-500 font-bold">{errors.description}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Gambar Produk</label>
                
                {data.image && (
                  <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                    <img 
                      src={data.image instanceof File ? URL.createObjectURL(data.image) : data.image} 
                      alt="Preview" 
                      className="object-cover w-full h-full" 
                    />
                    <button 
                      type="button"
                      onClick={() => setData('image', '')}
                      className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 shadow-sm"
                      title="Hapus Gambar"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    id="product-image-file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        setData('image', file);
                      }
                    }}
                    className="hidden"
                  />
                  <label 
                    htmlFor="product-image-file"
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 cursor-pointer transition-colors"
                  >
                    {data.image ? 'Ubah Gambar' : 'Pilih File Gambar'}
                  </label>
                  {data.image && (
                    <span className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
                      {data.image instanceof File ? data.image.name : 'Gambar saat ini'}
                    </span>
                  )}
                </div>
                {errors.image && <span className="text-xs text-rose-500 font-bold">{errors.image}</span>}
              </div>

              {/* Tier Prices Section */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Harga Bertingkat (Grosir)</label>
                  <button 
                    type="button" 
                    onClick={() => setData('tier_prices', [...(data.tier_prices || []), { min_quantity: '', price: '' }])}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Plus size={12} /> Tambah Tier
                  </button>
                </div>
                {data.tier_prices?.map((tier, index) => (
                  <div key={index} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="flex-1">
                      <input 
                        type="number" 
                        placeholder="Min. Qty" 
                        value={tier.min_quantity}
                        onChange={(e) => {
                          const newTiers = [...data.tier_prices];
                          newTiers[index].min_quantity = e.target.value;
                          setData('tier_prices', newTiers);
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-emerald-500"
                        min="2"
                      />
                    </div>
                    <div className="flex-1">
                      <input 
                        type="number" 
                        placeholder="Harga (Rp)" 
                        value={tier.price}
                        onChange={(e) => {
                          const newTiers = [...data.tier_prices];
                          newTiers[index].price = e.target.value;
                          setData('tier_prices', newTiers);
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-emerald-500"
                        min="0"
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        const newTiers = [...data.tier_prices];
                        newTiers.splice(index, 1);
                        setData('tier_prices', newTiers);
                      }}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Variants Section */}
              <div className="space-y-3 pt-4 border-t border-slate-100 pb-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Variasi Produk (Ukuran/Warna)</label>
                  <button 
                    type="button" 
                    onClick={() => setData('variants', [...(data.variants || []), { name: '', sku: '', price: '', stock: '' }])}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Plus size={12} /> Tambah Variasi
                  </button>
                </div>
                {data.variants?.map((variant, index) => (
                  <div key={index} className="flex flex-col gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 relative">
                    <button 
                      type="button" 
                      onClick={() => {
                        const newVariants = [...data.variants];
                        newVariants.splice(index, 1);
                        setData('variants', newVariants);
                      }}
                      className="absolute top-2 right-2 text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="grid grid-cols-2 gap-2 pr-6">
                      <input 
                        type="text" 
                        placeholder="Nama (misal: Merah, XL)" 
                        value={variant.name}
                        onChange={(e) => {
                          const newVariants = [...data.variants];
                          newVariants[index].name = e.target.value;
                          setData('variants', newVariants);
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <input 
                        type="text" 
                        placeholder="SKU (Opsional)" 
                        value={variant.sku}
                        onChange={(e) => {
                          const newVariants = [...data.variants];
                          newVariants[index].sku = e.target.value;
                          setData('variants', newVariants);
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <input 
                        type="number" 
                        placeholder="Harga Tambahan / Berbeda" 
                        value={variant.price}
                        onChange={(e) => {
                          const newVariants = [...data.variants];
                          newVariants[index].price = e.target.value;
                          setData('variants', newVariants);
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <input 
                        type="number" 
                        placeholder="Stok Variasi" 
                        value={variant.stock}
                        onChange={(e) => {
                          const newVariants = [...data.variants];
                          newVariants[index].stock = e.target.value;
                          setData('variants', newVariants);
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-bold text-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={processing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-lg text-sm font-bold shadow-sm transition-all"
                >
                  {processing ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden transform transition-all p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle size={24} />
              <h3 className="font-bold text-slate-900 text-lg">Hapus Produk?</h3>
            </div>
            
            <p className="text-sm text-slate-500 font-medium">
              Apakah Anda yakin ingin menghapus <strong className="text-slate-800">{productToDelete.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-700 transition-colors"
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all"
              >
                Hapus Produk
              </button>
          </div>
        </div>
      </div>
      )}

      {/* Custom Patungan Offer Modal */}
      {activePatunganOffer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden transform transition-all flex flex-col max-h-[90vh] animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-lg">Tawarkan Harga Patungan</h3>
              <button onClick={() => setActivePatunganOffer(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-900">{activePatunganOffer.product_name || activePatunganOffer.product?.name}</p>
                  <p className="text-xs text-amber-700 font-medium">
                    Kebutuhan: <strong className="text-amber-900">{activePatunganOffer.target_quantity}</strong> oleh <strong className="text-amber-900">{activePatunganOffer.participant_count || 0} UMKM</strong>
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Harga Penawaran Anda (Rp / Unit)</label>
                <input 
                  type="number" 
                  value={offerPrice}
                  onChange={e => setOfferPrice(e.target.value)}
                  placeholder="Contoh: 32000"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Catatan Tambahan (Opsional)</label>
                <textarea 
                  value={offerNotes}
                  onChange={e => setOfferNotes(e.target.value)}
                  placeholder="Contoh: Harga khusus termasuk ongkos kirim..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={() => setActivePatunganOffer(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-white rounded-lg text-sm font-semibold text-slate-700 transition-colors"
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={submitOffer}
                disabled={offerSubmitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-lg text-sm font-bold shadow-sm transition-all"
              >
                {offerSubmitting ? 'Mengajukan...' : 'Kirim Penawaran'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {isOrderDetailOpen && selectedOrderDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden transform transition-all flex flex-col max-h-[90vh] animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  Detail Pesanan <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-xs font-mono">{selectedOrderDetail.id}</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">{selectedOrderDetail.date}</p>
              </div>
              <button onClick={() => setIsOrderDetailOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 bg-white rounded-full border border-slate-200 shadow-sm">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Customer Info */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                  {selectedOrderDetail.customer.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">{selectedOrderDetail.customer}</h4>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><MapPin size={14}/> Bandung Barat, ID</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Daftar Produk</h4>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{selectedOrderDetail.product}</p>
                        <p className="text-xs text-slate-500">{selectedOrderDetail.quantity} {selectedOrderDetail.unit}</p>
                      </div>
                    </div>
                    <p className="font-bold text-slate-800">{formatPrice(selectedOrderDetail.total)}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrderDetail.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertTriangle size={14} /> Catatan Pembeli
                  </h4>
                  <p className="text-sm text-amber-900 font-medium">{selectedOrderDetail.notes}</p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="text-sm">
                <span className="text-slate-500 font-semibold">Status:</span>
                <span className="ml-2 font-bold text-slate-800 bg-white border border-slate-200 px-3 py-1 rounded-full text-xs">
                  {selectedOrderDetail.status}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <a 
                  href={`/supplier/orders/${selectedOrderDetail.rawId || selectedOrderDetail.id.replace('ORD-', '')}/invoice`} 
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                >
                  <FileText size={16} /> Cetak Dokumen
                </a>
                <a 
                  href={`https://wa.me/6281234567890?text=Halo%20kak,%20saya%20dari%20Supplier%20ingin%20mengkonfirmasi%20pesanan%20${selectedOrderDetail.id}`} 
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                >
                  <MessageCircle size={16} /> Hubungi Pembeli
                </a>
                <button 
                  type="button"
                  onClick={() => setIsOrderDetailOpen(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-bold shadow-sm transition-all"
                >
                  Tutup Detail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Withdraw Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-lg">Tarik Dana</h3>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-500 font-medium">Saldo Anda: <span className="font-bold text-emerald-600">{formatPrice(wallet.balance)}</span></p>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Jumlah Penarikan</label>
                <input 
                  type="number" 
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="Min. 10000"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsWithdrawModalOpen(false)} className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-semibold text-slate-700">Batal</button>
              <button 
                onClick={async () => {
                  try {
                    await withdraw(withdrawAmount);
                    setToast({ visible: true, type: 'success', message: 'Permintaan penarikan dana berhasil.' });
                    setIsWithdrawModalOpen(false);
                    setWithdrawAmount('');
                  } catch (err) {
                    setToast({ visible: true, type: 'error', message: 'Penarikan gagal.' });
                  }
                }}
                disabled={walletLoading || !withdrawAmount || withdrawAmount < 10000}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold"
              >
                Tarik
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Modal */}
      {isShippingModalOpen && orderToShip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2"><Truck size={20} /> Input Resi Pengiriman</h3>
              <button onClick={() => setIsShippingModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm font-medium text-slate-500 mb-2">Order ID: <strong className="text-slate-800">{orderToShip.id}</strong></p>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Kurir Pengiriman</label>
                <input 
                  type="text" 
                  value={shippingForm.courier}
                  onChange={e => setShippingForm({ ...shippingForm, courier: e.target.value })}
                  placeholder="Contoh: JNE, J&T, Sicepat"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Nomor Resi</label>
                <input 
                  type="text" 
                  value={shippingForm.tracking}
                  onChange={e => setShippingForm({ ...shippingForm, tracking: e.target.value })}
                  placeholder="Masukkan Nomor Resi"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsShippingModalOpen(false)} className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-semibold text-slate-700">Batal</button>
              <button 
                onClick={async () => {
                  if (!shippingForm.courier || !shippingForm.tracking) {
                    setToast({ visible: true, type: 'error', message: 'Kurir dan Resi harus diisi.' });
                    return;
                  }
                  await changeStatus(orderToShip.rawId, 'shipped', {
                    shipping_courier: shippingForm.courier,
                    tracking_number: shippingForm.tracking
                  });
                  setToast({ visible: true, type: 'success', message: 'Pesanan berhasil dikirim!' });
                  setIsShippingModalOpen(false);
                  setShippingForm({ courier: '', tracking: '' });
                }}
                disabled={!shippingForm.courier || !shippingForm.tracking}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold"
              >
                Simpan & Kirim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Ledger Modal */}
      {isStockLedgerOpen && selectedProductForLedger && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2"><FileText size={20} /> Riwayat Stok</h3>
              <button onClick={() => setIsStockLedgerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-lg shrink-0 overflow-hidden">
                  {selectedProductForLedger.image ? (
                    <img src={`/storage/${selectedProductForLedger.image}`} alt="Prod" className="w-full h-full object-cover" />
                  ) : <Package className="w-6 h-6 m-3 text-slate-400" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{selectedProductForLedger.name}</h4>
                  <p className="text-sm font-medium text-slate-500">Sisa Stok: <span className="font-bold text-emerald-600">{selectedProductForLedger.stock} {selectedProductForLedger.unit}</span></p>
                </div>
              </div>
            </div>
            <div className="p-5 flex-1 overflow-auto">
              {ledgerLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse"></div>)}
                </div>
              ) : !ledgers || ledgers.length === 0 ? (
                <div className="text-center text-slate-500 py-10">
                  Belum ada riwayat pergerakan stok.
                </div>
              ) : (
                <div className="space-y-3">
                  {ledgers.map((l, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{l.reason}</p>
                        <p className="text-xs text-slate-500">{new Date(l.created_at).toLocaleString('id-ID')}</p>
                      </div>
                      <div className={`font-bold ${l.change_amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {l.change_amount > 0 ? '+' : ''}{l.change_amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button onClick={() => setIsStockLedgerOpen(false)} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold shadow-sm">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col border border-slate-100 max-h-[90vh]">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50 rounded-t-2xl">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Upload CSV Produk</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-emerald-500 transition-colors relative cursor-pointer group bg-slate-50">
                  <input 
                    type="file" 
                    accept=".csv,.txt"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload size={32} className="mx-auto text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-slate-800 text-sm">Pilih File CSV</p>
                  <p className="text-xs text-slate-500 mt-1">{uploadFile ? uploadFile.name : 'atau drag & drop di sini'}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-800">
                  <p className="font-bold mb-1">Format Header CSV harus persis:</p>
                  <p className="font-mono bg-amber-100 p-1 rounded inline-block">name,category,price,stock,unit,description</p>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Batal</button>
                  <button type="submit" disabled={uploading || !uploadFile} className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm transition-all ${uploading || !uploadFile ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                    {uploading ? 'Mengupload...' : 'Mulai Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={!!productToDelete}
        onConfirm={confirmDelete}
        onCancel={() => setProductToDelete(null)}
        type="delete"
        title="Hapus Produk Ini Selamanya?"
        message={`Anda yakin ingin menghapus <strong>${productToDelete?.name}</strong> dari etalase? Semua riwayat penjualan dan ulasan terkait akan hilang.`}
        confirmText="Tetap Hapus"
        cancelText="Jangan Hapus"
        confirmColor="red"
        highlightCancel={true}
      />

      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onConfirm={performLogout}
        onCancel={() => setIsLogoutConfirmOpen(false)}
        type="warning"
        title="Keluar dari Portal?"
        message="Anda akan keluar dari sesi saat ini. Anda harus login kembali untuk mengelola toko Anda."
        confirmText="Keluar"
        cancelText="Batal"
        confirmColor="orange"
      />

      <ConfirmModal
        isOpen={!!orderToProcess}
        onConfirm={() => {
          updateOrderStatus(orderToProcess.id, 'Processing');
          setOrderToProcess(null);
        }}
        onCancel={() => setOrderToProcess(null)}
        type="confirm"
        title="Proses Pesanan Ini?"
        message={`Anda akan memproses pesanan <strong>${orderToProcess?.id}</strong>. Tindakan ini akan <strong>memotong stok</strong> produk Anda secara otomatis dan status akan berubah menjadi Sedang Diproses.`}
        confirmText="Proses Pesanan"
        cancelText="Batal"
        confirmColor="blue"
      />

      <ConfirmModal
        isOpen={!!orderToComplete}
        onConfirm={() => {
          updateOrderStatus(orderToComplete.id, 'Completed');
          setOrderToComplete(null);
        }}
        onCancel={() => setOrderToComplete(null)}
        type="success"
        title="Selesaikan Pesanan?"
        message={`Anda akan menyelesaikan pesanan <strong>${orderToComplete?.id}</strong>. Pendapatan dari pesanan ini akan langsung <strong>ditambahkan ke saldo Anda</strong>. Tindakan ini tidak bisa dibatalkan.`}
        confirmText="Tandai Selesai"
        cancelText="Batal"
        confirmColor="green"
      />

      {/* Bulk Status Modal */}
      {isBulkStatusModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden transform transition-all animate-scaleIn">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">Ubah Status Massal</h3>
              <button onClick={() => setIsBulkStatusModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm font-medium text-slate-600">Pilih status baru untuk <strong className="text-slate-800">{selectedOrders.length} pesanan</strong> yang dipilih:</p>
              <select 
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="">-- Pilih Status --</option>
                <option value="Processing">Processing (Sedang Diproses)</option>
                <option value="Shipped">Shipped (Dikirim)</option>
                <option value="Completed">Completed (Selesai)</option>
              </select>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button onClick={() => setIsBulkStatusModalOpen(false)} className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-semibold text-slate-700">Batal</button>
              <button onClick={handleBulkUpdateStatus} disabled={!bulkStatus} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-sm">Simpan</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
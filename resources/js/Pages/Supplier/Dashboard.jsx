import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import useProducts from '../../hooks/useProducts';
import useOrders from '../../hooks/useOrders';
import useAIInsight from '../../hooks/useAIInsight.js';
import sirkelScoreService from '../../services/sirkelScoreService';
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
  Sliders
} from 'lucide-react';

export default function Dashboard({ groupBuying = [], flash = {} } = {}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  const { products, loading: prodLoading, fetchProducts, addProduct, editProduct, removeProduct } = useProducts();
  const { orders, loading: ordersLoading, fetchSupplierOrders, changeStatus } = useOrders();
  const { loading: aiLoading, fetchReviewSummary, fetchBusinessInsight } = useAIInsight();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  // States to fix blank screen
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);
  
  // Products filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');

  // Interactive local states
  const [localOrders, setLocalOrders] = useState([]);
  const [localGroupBuying, setLocalGroupBuying] = useState([]);
  const [sirkelScore, setSirkelScore] = useState(null);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Orders status filter
  const [orderFilter, setOrderFilter] = useState('all');

  // Patungan submission state
  const [activePatunganOffer, setActivePatunganOffer] = useState(null);
  const [offerPrice, setOfferPrice] = useState('');

  // Flash notifications auto-fade state
  const [showFlash, setShowFlash] = useState({ success: false, error: false });

  const supplier = user?.profile || {
    id: 1,
    supplier_name: 'Mitra Supplier',
    description: 'Penyedia bahan baku terpercaya',
    address: 'Kota Malang',
    rating: 5.0,
    sirkel_score: 92
  };

  // Load data on mount
  useEffect(() => {
    const loadSupplierData = async () => {
      if (!supplier?.id) return;
      setIsLoading(true);
      try {
        await Promise.all([
          fetchProducts(),
          fetchSupplierOrders(),
          sirkelScoreService.getSupplierSirkelScore(supplier.id).then(res => {
            if (res.success) setSirkelScore(res.data);
          }).catch(err => console.error('SirkelScore API error:', err)),
          fetchReviewSummary(supplier.id).then(res => {
            if (res) setReviewSummary(res);
          }).catch(err => console.error('AI Review Summary error:', err)),
          fetchBusinessInsight().then(res => {
            if (res) setAiInsight(res.insight || res);
          }).catch(err => console.error('AI Business Insight error:', err))
        ]);
      } catch (err) {
        console.error('Error loading supplier data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSupplierData();
  }, [supplier?.id, fetchProducts, fetchSupplierOrders, fetchReviewSummary, fetchBusinessInsight]);

  useEffect(() => {
    if (orders.length > 0) {
      // Map to fit view structure
      const mapped = orders.map(o => {
        const d = new Date(o.created_at || Date.now());
        const formattedDate = `${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })} ${d.getFullYear()}`;
        return {
          id: `ORD-${String(o.id).padStart(5, '0')}`,
          customer: o.buyer?.name || 'UMKM Owner',
          date: formattedDate,
          total: o.total_price,
          status: o.status.charAt(0).toUpperCase() + o.status.slice(1)
        };
      });
      setLocalOrders(mapped);
    }
  }, [orders]);

  useEffect(() => {
    if (groupBuying.length > 0) {
      setLocalGroupBuying(groupBuying);
    } else {
      setLocalGroupBuying([
        { id: 1, product: 'Bawang Putih Kating (Sirkel UMKM Kuliner)', demand: '800 kg', participants: 12, revenue: 28000000, deadline: '2 hari lagi' },
        { id: 2, product: 'Cabai Rawit Merah (Sirkel Sambal Nusantara)', demand: '350 kg', participants: 8, revenue: 21000000, deadline: '5 hari lagi' },
        { id: 3, product: 'Kemasan Box Corrugated (Sirkel Snack Cihanjuang)', demand: '5,000 pcs', participants: 15, revenue: 12500000, deadline: '6 jam lagi' },
      ]);
    }
  }, [groupBuying]);

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
        setProductToDelete(null);
      } catch (err) {
        alert(err.response?.data?.message || 'Gagal menghapus produk.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      formData.append('supplier_id', supplier.id);
      
      if (data.image) {
        formData.append('image', data.image);
      }

      if (editingProduct) {
        await editProduct(editingProduct.id, formData);
      } else {
        await addProduct(formData);
      }
      setIsModalOpen(false);
      reset();
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        alert(err.response?.data?.message || 'Gagal menyimpan produk.');
      }
    } finally {
      setProcessing(false);
    }
  };
  const updateOrderStatus = async (orderId, newStatus) => {
    const numericId = parseInt(orderId.replace('ORD-', ''), 10);
    try {
      await changeStatus(numericId, newStatus.toLowerCase());
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Gagal memperbarui status pesanan.');
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

  // Static UMKM Review distribution
  const reviewsData = {
    average: currentSupplier.rating ? Number(currentSupplier.rating).toFixed(1) : '4.8',
    total: 45,
    distribution: [
      { stars: 5, count: 32, percentage: 71 },
      { stars: 4, count: 10, percentage: 22 },
      { stars: 3, count: 2, percentage: 5 },
      { stars: 2, count: 1, percentage: 2 },
      { stars: 1, count: 0, percentage: 0 },
    ],
    items: [
      { name: 'UMKM Bakso Mas Agus', date: '24 Jun 2026', stars: 5, text: 'Bawang merah dan bawang putih kating yang dikirim segar-segar. Sangat membantu menjaga kualitas kuah bakso kami.' },
      { name: 'Resto Sunda Nikmat', date: '22 Jun 2026', stars: 4, text: 'Beras Pandan Wanginya pulen banget. Langganan setia untuk nasi timbel kami. Pengiriman biasanya cepat, respon seller ramah.' },
      { name: 'Catering Berkah', date: '20 Jun 2026', stars: 5, text: 'Gula pasir kristal putih selalu bersih dan pengemasan rapi menggunakan karung tebal. Sangat recommended untuk mitra sirkel.' },
      { name: 'Warteg Kharisma', date: '18 Jun 2026', stars: 5, text: 'Tepung terigu kemasan karung harganya bersaing ketat dengan pasar konvensional. Menghemat margin keuntungan jualan kami.' }
    ]
  };

  // Definitions for stats and logout handler to fix undefined variables
  const totalProducts = products.length;
  const activeStock = products.reduce((acc, curr) => acc + (curr.stock || 0), 0);
  const totalOrders = orders.length;
  const supplierRating = Number(currentSupplier.rating || 5.0).toFixed(1);

  const stats = [
    { name: 'Total Products', value: `${totalProducts} Produk`, change: 'Katalog aktif', changeType: 'normal' },
    { name: 'Active Stock', value: `${activeStock} Unit`, change: activeStock < 50 ? 'Stok menipis' : 'Stok melimpah', changeType: activeStock < 50 ? 'warning' : 'positive' },
    { name: 'Total Orders', value: `${totalOrders} Pesanan`, change: 'Total pesanan masuk', changeType: 'normal' },
    { name: 'Rating', value: supplierRating, change: `Skor Sirkel: ${sirkelScore?.score || currentSupplier.sirkel_score || 90}`, changeType: 'positive' }
  ];

  const handleLogout = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <Layers className="h-5 w-5" />
              </div>
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
          <nav className="flex-1 space-y-1.5 px-1 overflow-y-auto">
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
      <div className="flex-1 lg:pl-64 flex flex-col overflow-x-hidden min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white/80 backdrop-blur-md px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-[#64748B] hover:text-[#0F172A]" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            {/* SEARCH BAR */}
            <div className="relative w-80 hidden sm:block">
              <Search className="absolute top-2.5 left-3.5 h-4.5 w-4.5 text-[#94A3B8]" />
              <input 
                type="text" 
                placeholder="Cari produk, sirkel patungan..."
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-2 pl-10 pr-4 text-xs font-medium outline-none transition-all duration-200 focus:border-[#16A34A] focus:bg-white focus:ring-1 focus:ring-[#16A34A]/25"
                readOnly
              />
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
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
                
                <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-2xl ring-1 ring-[#0F172A]/5 z-50 animate-fadeIn max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2 mb-3">
                    <span className="font-bold text-sm text-[#0F172A] flex items-center gap-1.5">
                      <Bell className="h-4 w-4 text-[#16A34A]" />
                      <span>Notifikasi ({unreadCount})</span>
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

                  <div className="space-y-2 divide-y divide-[#F1F5F9]/50 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-[#94A3B8] text-center py-6 text-xs font-semibold">Tidak ada notifikasi.</p>
                    ) : (
                      notifications.map((notif) => {
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
                            className={`flex flex-col gap-1 rounded-xl p-3.5 cursor-pointer transition-colors ${!notif.read ? 'bg-green-50/20' : 'hover:bg-[#F8FAFC]'}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-xs ${!notif.read ? 'font-bold text-[#0F172A]' : 'font-medium text-[#64748B]'}`}>{notif.title}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-[#94A3B8] font-medium">{notif.time}</span>
                                {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] shrink-0"></span>}
                              </div>
                            </div>
                            <p className={`text-xs leading-relaxed ${!notif.read ? 'text-[#0F172A] font-medium' : 'text-[#64748B]'}`}>{notif.message}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
            
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
        <main className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto flex-1">
          {/* Flash Feedback Banner */}
          {showFlash.success && (
            <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-lg shadow-sm flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-emerald-600" size={20} />
                <span className="text-emerald-800 text-sm font-semibold">{flash.success}</span>
              </div>
              <button onClick={() => setShowFlash(prev => ({ ...prev, success: false }))} className="text-emerald-500 hover:text-emerald-700">
                <X size={16} />
              </button>
            </div>
          )}
          {showFlash.error && (
            <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-r-lg shadow-sm flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-rose-600" size={20} />
                <span className="text-rose-800 text-sm font-semibold">{flash.error}</span>
              </div>
              <button onClick={() => setShowFlash(prev => ({ ...prev, error: false }))} className="text-rose-500 hover:text-rose-700">
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

              {/* SECTION 3: REKOMENDASI ANALISIS PASAR */}
              <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 text-slate-100 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-2 rounded-full bg-slate-800 border border-slate-700/50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider w-fit text-emerald-400">
                    <TrendingUp className="h-4 w-4" />
                    Ringkasan Analisis Pasar
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold leading-tight tracking-tight text-white">
                    Peluang Pasar Terkini
                  </h2>
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
                    {aiInsight || "Berdasarkan histori transaksi UMKM kuliner di Bandung Raya, permintaan Bawang Merah dan Cabai Rawit diprediksi akan meningkat 18% dalam 2 minggu ke depan. Kami merekomendasikan untuk menaikkan stok aktif dan menawarkan penawaran khusus ke sirkel kuliner terdekat."}
                  </p>
                </div>

                <div className="shrink-0 flex flex-col gap-2 self-start lg:self-center">
                  <button 
                    onClick={() => setActiveTab('products')} 
                    className="rounded-2xl bg-emerald-600 px-6 py-3.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                  >
                    Kelola Stok
                    <ArrowRight className="h-4 w-4" />
                  </button>
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
                    {localGroupBuying.slice(0, 2).map((group) => (
                      <div key={group.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{group.product}</p>
                          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-semibold">
                            <span className="flex items-center gap-1"><Users size={12} /> {group.participants} UMKM</span>
                            <span>Bahan Baku: {group.demand}</span>
                          </div>
                        </div>
                        <div className="h-px bg-slate-200/80"></div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Potensi Omzet</p>
                            <p className="font-bold text-emerald-600 text-sm">{formatPrice(group.revenue)}</p>
                          </div>
                          <button 
                            onClick={() => { setActivePatunganOffer(group); setOfferPrice(Math.round(group.revenue / parseInt(group.demand)).toString()); }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                          >
                            Tawarkan
                          </button>
                        </div>
                      </div>
                    ))}
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
                <button 
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-all text-sm self-start sm:self-center"
                >
                  <Plus size={16} />
                  <span>Tambah Produk Baru</span>
                </button>
              </div>

              {/* Filters Panel */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Cari produk berdasarkan nama..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
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
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50 text-xs uppercase tracking-wider">
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
                                  {isPending && (
                                    <button 
                                      onClick={() => updateOrderStatus(ord.id, 'Processing')}
                                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                    >
                                      Proses Pesanan
                                    </button>
                                  )}
                                  {isProcessing && (
                                    <button 
                                      onClick={() => updateOrderStatus(ord.id, 'Completed')}
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
                {localGroupBuying.map((group) => (
                  <div key={group.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4 hover:shadow-md transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                          {group.deadline}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Batas Penawaran</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-base">{group.product}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        Aliansi UMKM Kuliner sedang melakukan patungan untuk memenuhi kebutuhan produksi. Ajukan harga penawaran Anda sekarang!
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between text-xs text-slate-600 font-semibold border border-slate-100">
                      <span className="flex items-center gap-1"><Users size={14} /> {group.participants} UMKM Tergabung</span>
                      <span>Total Kebutuhan: {group.demand}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimasi Omzet</p>
                        <p className="font-extrabold text-emerald-600 text-base">{formatPrice(group.revenue)}</p>
                      </div>
                      <button 
                        onClick={() => { setActivePatunganOffer(group); setOfferPrice(Math.round(group.revenue / parseInt(group.demand)).toString()); }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                      >
                        Tawarkan Harga
                      </button>
                    </div>
                  </div>
                ))}
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
                  <p className="text-5xl font-extrabold text-slate-900 tracking-tight">{reviewsData.average}</p>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="fill-amber-500" size={20} />
                    <Star className="fill-amber-500" size={20} />
                    <Star className="fill-amber-500" size={20} />
                    <Star className="fill-amber-500" size={20} />
                    <Star className="fill-amber-500" size={20} />
                  </div>
                  <p className="text-xs text-slate-500 font-semibold">Berdasarkan {reviewsData.total} rating pelanggan</p>
                </div>

                {/* Stars distribution */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2 space-y-2.5">
                  <h4 className="text-sm font-bold text-slate-800">Distribusi Rating Bintang</h4>
                  <div className="space-y-2">
                    {reviewsData.distribution.map((d) => (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviewsData.items.map((r, idx) => (
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
              </div>
            </div>
          )}
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">URL Gambar Produk (Opsional)</label>
                <input 
                  type="text" 
                  value={data.image} 
                  onChange={e => setData('image', e.target.value)} 
                  placeholder="Contoh: https://images.unsplash.com/... atau path lokal"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
                {errors.image && <span className="text-xs text-rose-500 font-bold">{errors.image}</span>}
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
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden transform transition-all p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Tawarkan Harga Patungan</h3>
              <button onClick={() => setActivePatunganOffer(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">{activePatunganOffer.product}</p>
              <p className="text-xs text-slate-500 font-semibold">
                Kebutuhan: <span className="text-slate-700 font-bold">{activePatunganOffer.demand}</span> • Oleh <span className="text-slate-700 font-bold">{activePatunganOffer.participants} UMKM</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Harga Penawaran Anda (Rp / Unit)</label>
              <input 
                type="number" 
                value={offerPrice}
                onChange={e => setOfferPrice(e.target.value)}
                placeholder="Contoh: 32000"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setActivePatunganOffer(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-700 transition-colors"
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={() => {
                  if(!offerPrice || isNaN(offerPrice) || Number(offerPrice) <= 0) {
                    alert('Masukkan harga penawaran yang valid');
                    return;
                  }
                  alert(`Penawaran harga ${formatPrice(offerPrice)} berhasil diajukan untuk patungan ${activePatunganOffer.product}!`);
                  setActivePatunganOffer(null);
                  setOfferPrice('');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all"
              >
                Kirim Penawaran
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

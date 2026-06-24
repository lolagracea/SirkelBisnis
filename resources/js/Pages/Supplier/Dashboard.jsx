import React, { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
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
  ChevronDown
} from 'lucide-react';

export default function Dashboard({ auth, supplier, products = [], stats = [], recentOrders = [], groupBuying = [], flash = {}, aiInsight }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  
  // Products filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');

  // Interactive local states initialized from props
  const [localOrders, setLocalOrders] = useState([]);
  const [localGroupBuying, setLocalGroupBuying] = useState([]);
  
  // Orders status filter
  const [orderFilter, setOrderFilter] = useState('all');

  // Notifications states
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      title: 'Pesanan Baru Masuk', 
      message: 'Resto Sunda Nikmat membuat pesanan baru (ORD-8941).', 
      time: '10 menit yang lalu', 
      read: false,
      type: 'order'
    },
    { 
      id: 2, 
      title: 'Peluang Patungan Baru', 
      message: 'Sirkel kuliner terdekat membutuhkan 800 kg Bawang Putih.', 
      time: '2 jam yang lalu', 
      read: false,
      type: 'patungan'
    },
    { 
      id: 3, 
      title: 'Akun Terverifikasi', 
      message: 'Akun supplier Anda telah terverifikasi penuh oleh admin.', 
      time: '1 hari yang lalu', 
      read: true,
      type: 'system'
    },
  ]);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Patungan submission state
  const [activePatunganOffer, setActivePatunganOffer] = useState(null);
  const [offerPrice, setOfferPrice] = useState('');

  // Flash notifications auto-fade state
  const [showFlash, setShowFlash] = useState({ success: false, error: false });

  useEffect(() => {
    if (recentOrders.length > 0) {
      setLocalOrders(recentOrders);
    } else {
      setLocalOrders([
        { id: 'ORD-8941', customer: 'Resto Sunda Nikmat', date: '25 Jun 2026', total: 1450000, status: 'Pending' },
        { id: 'ORD-8940', customer: 'UMKM Bakso Mas Agus', date: '24 Jun 2026', total: 890000, status: 'Completed' },
        { id: 'ORD-8939', customer: 'Catering Berkah', date: '24 Jun 2026', total: 4120000, status: 'Processing' },
        { id: 'ORD-8938', customer: 'Warteg Kharisma', date: '23 Jun 2026', total: 345000, status: 'Completed' },
      ]);
    }
  }, [recentOrders]);

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

  const user = auth?.user || { name: 'Supplier PJ', role: 'supplier' };
  const currentSupplier = supplier || {
    supplier_name: user.name,
    description: 'Penyedia bahan baku berkualitas untuk UMKM.',
    address: 'Alamat belum diisi.',
    verified: false,
    rating: 5.0
  };

  // Form management for Add/Edit product using Inertia useForm
  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    name: '',
    category: 'Bahan Pangan',
    price: '',
    stock: '',
    unit: 'pcs',
    description: '',
    image: '',
  });

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProduct) {
      put(`/supplier/products/${editingProduct.id}`, {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        }
      });
    } else {
      post('/supplier/products', {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        }
      });
    }
  };

  // Interactive: update local orders status for testing
  const updateOrderStatus = (orderId, newStatus) => {
    setLocalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  // Filtered products for products tab
  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'Semua' || prod.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filtered orders for orders tab
  const filteredOrders = localOrders.filter(o => {
    if (orderFilter === 'all') return true;
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

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar for desktop and mobile */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-400 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out flex flex-col justify-between border-r border-slate-800 shrink-0`}>
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">S</div>
              <span className="text-white font-bold text-lg tracking-tight">Sirkel Bisnis</span>
            </div>
            <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Sidebar Menu Links */}
          <nav className="p-4 space-y-1">
            <button 
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'dashboard' ? 'text-white bg-slate-800' : 'hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Layers size={18} />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => { setActiveTab('products'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'products' ? 'text-white bg-slate-800' : 'hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Package size={18} />
              <span>Kelola Produk</span>
            </button>
            <button 
              onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'orders' ? 'text-white bg-slate-800' : 'hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ShoppingCart size={18} />
              <span>Kelola Pesanan</span>
            </button>
            <button 
              onClick={() => { setActiveTab('group-buying'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'group-buying' ? 'text-white bg-slate-800' : 'hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Users size={18} />
              <span>Sirkel Patungan</span>
            </button>
            <button 
              onClick={() => { setActiveTab('reviews'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'reviews' ? 'text-white bg-slate-800' : 'hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Star size={18} />
              <span>Ulasan & Rating</span>
            </button>
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-700/50 flex items-center justify-center text-emerald-400">
              <User size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white truncate max-w-[120px]">{currentSupplier.supplier_name}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
          </div>
          <button className="text-slate-500 hover:text-rose-400 transition-colors" title="Log Out" onClick={() => {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/logout';
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (csrf) {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = '_token';
              input.value = csrf;
              form.appendChild(input);
            }
            document.body.appendChild(form);
            form.submit();
          }}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-x-hidden min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-600 hover:text-slate-900" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 w-80 text-slate-400 text-sm">
              <Search size={16} />
              <span>Cari produk, sirkel patungan...</span>
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-all focus:outline-none"
              title="Notifikasi"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </button>

            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                
                <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden transform origin-top-right transition-all animate-scaleIn">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Bell size={16} className="text-emerald-600" />
                      <span>Notifikasi ({unreadCount})</span>
                    </span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-bold"
                      >
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>

                  <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="text-slate-400 text-center py-8 text-xs font-semibold">Tidak ada notifikasi.</p>
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
                            className={`p-4 flex gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-emerald-50/20' : ''}`}
                          >
                            <div className={`p-2 rounded-lg shrink-0 self-start ${!notif.read ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                              <NotifIcon size={16} />
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center justify-between">
                                <p className={`text-xs font-bold ${!notif.read ? 'text-slate-900' : 'text-slate-700'}`}>{notif.title}</p>
                                {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>}
                              </div>
                              <p className={`text-xs leading-relaxed ${!notif.read ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>{notif.message}</p>
                              <span className="text-[10px] text-slate-400 font-bold block mt-1">{notif.time}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
                    <button 
                      onClick={() => { 
                        setIsNotificationsOpen(false); 
                        alert('Halaman pusat notifikasi akan tersedia setelah diintegrasikan dengan modul notifikasi sistem.'); 
                      }}
                      className="text-xs text-slate-500 hover:text-slate-700 font-bold"
                    >
                      Lihat Semua Notifikasi
                    </button>
                  </div>
                </div>
              </>
            )}
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700 hidden md:inline">{currentSupplier.supplier_name}</span>
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                {currentSupplier.supplier_name.charAt(0)}
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
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-900">{currentSupplier.supplier_name}</h2>
                    {currentSupplier.verified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle size={12} />
                        <span>Terverifikasi</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <Clock size={12} />
                        <span>Menunggu Verifikasi</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-amber-500 font-bold text-sm bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      <Star size={14} className="fill-amber-500" />
                      <span>{Number(currentSupplier.rating || 5.0).toFixed(1)}</span>
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm max-w-2xl">{currentSupplier.description}</p>
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                    <MapPin size={14} />
                    <span>{currentSupplier.address}</span>
                  </div>
                </div>
                
                <button 
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-all text-sm shrink-0"
                >
                  <Plus size={16} />
                  <span>Tambah Produk Baru</span>
                </button>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => {
                  const Icon = getIcon(stat.name);
                  return (
                    <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.name}</span>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                          <Icon size={18} />
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</span>
                        <p className={`text-xs mt-1.5 flex items-center gap-1 font-semibold ${
                          stat.changeType === 'positive' ? 'text-emerald-600' : 
                          stat.changeType === 'warning' ? 'text-amber-600' : 'text-slate-500'
                        }`}>
                          {stat.change}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI Insight Card */}
              <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white rounded-xl border border-emerald-700 shadow-lg p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row justify-between gap-6 hover:shadow-xl transition-all">
                <div className="absolute -right-8 -bottom-8 text-emerald-700/25 pointer-events-none">
                  <Sparkles size={200} />
                </div>
                <div className="space-y-4 max-w-2xl z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600/30 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold">
                    <Sparkles size={14} className="animate-pulse" />
                    <span>Rekomendasi AI Insight</span>
                  </div>
                   <h2 className="text-xl md:text-2xl font-bold tracking-tight">Analisis AI Insight & Prediksi Pasar</h2>
                  <p className="text-emerald-100/90 text-sm leading-relaxed font-medium">
                    {aiInsight || "Berdasarkan histori transaksi UMKM kuliner di Bandung Raya, permintaan Bawang Merah dan Cabai Rawit diprediksi akan meningkat 18% dalam 2 minggu ke depan. Kami merekomendasikan untuk menaikkan stok aktif dan menawarkan penawaran khusus ke sirkel kuliner terdekat."}
                  </p>
                </div>
                <div className="flex flex-col justify-center gap-3 z-10 min-w-[160px]">
                  <button onClick={() => setActiveTab('products')} className="px-4 py-2.5 bg-white text-emerald-950 rounded-lg font-bold shadow-md hover:bg-emerald-50 transition-all text-sm flex items-center justify-center gap-2">
                    <span>Kelola Stok</span>
                    <ChevronRight size={14} />
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
                          const isProcessing = ord.status === 'Processing';
                          const isPending = ord.status === 'Pending';
                          const StatusIcon = isCompleted ? CheckCircle : isProcessing ? AlertTriangle : Clock;
                          
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
                onClick={() => {
                  router.delete(`/supplier/products/${productToDelete.id}`, {
                    onSuccess: () => setProductToDelete(null),
                    onError: () => setProductToDelete(null)
                  });
                }}
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

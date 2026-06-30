import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import useGroupBuyings from '../../hooks/useGroupBuyings';
import useOrders from '../../hooks/useOrders';
import useAIInsight from '../../hooks/useAIInsight';
import useProducts from '../../hooks/useProducts';
import supplierService from '../../services/supplierService';
import productService from '../../services/productService';
import useConfirmPopup from '../../hooks/useConfirmPopup';
import ConfirmModal from '../../components/ConfirmModal';
import { 
  Users, 
  ShoppingCart, 
  Wallet, 
  Award, 
  Sparkles, 
  Search, 
  Bell, 
  MapPin, 
  TrendingUp, 
  Calendar, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Info,
  Sliders,
  DollarSign,
  Plus,
  ShieldCheck,
  Star,
  RefreshCw,
  LogOut,
  User,
  Heart,
  ChevronDown,
  Layers,
  Menu,
  X
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar 
} from 'recharts';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  const { groupBuyings, loading: gbLoading, fetchGroupBuyings, joinGroupBuying, startGroupBuying } = useGroupBuyings();
  const { orders, loading: ordersLoading, fetchMyOrders, payOrder, placeOrder, changeStatus } = useOrders();
  const { loading: aiLoading, fetchBusinessInsight } = useAIInsight();
  const { products, loading: prodLoading, fetchProducts } = useProducts();
  const {
    modalProps,
    confirmGroupBuying,
    confirmB2BPurchase,
    confirmCancelOrder,
    confirmOrderReceipt,
  } = useConfirmPopup();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [orderFilter, setOrderFilter] = useState('all');

  // API Data States
  const [suppliers, setSuppliers] = useState([]);
  const [aiInsight, setAiInsight] = useState({
    business_condition: 'Kondisi stabil. Terus pantau pasar.',
    saving_opportunity: 'Peluang penghematan dengan memesan patungan kelompok.',
    group_buying_recommendation: 'Terdapat 2 patungan aktif yang cocok.',
    restock_recommendation: 'Stok diprediksi aman untuk 14 hari ke depan.',
    business_advice: 'Gunakan patungan kelompok untuk memaksimalkan margin keuntungan.'
  });

  // Input states for modal forms
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [joinQuantity, setJoinQuantity] = useState(10);
  const [isSuccessToastVisible, setIsSuccessToastVisible] = useState(false);
  const [successToastMessage, setSuccessToastMessage] = useState('');

  // States for Beli Langsung & Buat Patungan Modals
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isBeliModalOpen, setIsBeliModalOpen] = useState(false);
  const [isPatunganModalOpen, setIsPatunganModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  // Products belonging to the supplier shown in the "Lihat Supplier" modal.
  // Fetched directly from the server (filtered by supplier_id) instead of
  // relying on the globally-loaded `products` list, which is paginated to
  // only the first 10 products overall and may not include this supplier's
  // newest items.
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [supplierProductsLoading, setSupplierProductsLoading] = useState(false);
  
  // Form States
  const [beliQty, setBeliQty] = useState(50);
  const [beliNotes, setBeliNotes] = useState('');
  const [patunganTarget, setPatunganTarget] = useState(500);
  const [patunganMin, setPatunganMin] = useState(5);
  const [patunganDeadlineDays, setPatunganDeadlineDays] = useState(3);
  
  const [actionProcessing, setActionProcessing] = useState(false);

  // Fetch all products belonging to a specific supplier directly from the
  // server, so newly added products always show up regardless of where
  // they fall in the global products pagination.
  const fetchSupplierProducts = async (supplierId) => {
    setSupplierProductsLoading(true);
    try {
      const res = await productService.getProducts({ supplier_id: supplierId, per_page: 100 });
      const list = Array.isArray(res) ? res : (res.data || []);
      setSupplierProducts(list);
    } catch (err) {
      console.error('Supplier products error:', err);
      setSupplierProducts([]);
    } finally {
      setSupplierProductsLoading(false);
    }
  };

  const openSupplierModal = (s) => {
    setSelectedSupplier(s);
    setIsSupplierModalOpen(true);
    fetchSupplierProducts(s.id);
  };

  // Fetch suppliers from the backend, optionally filtered by a search keyword.
  // Always asks the server for a generous page size so newly registered
  // suppliers (which may not be among the first 10 by id) are included.
  const fetchSuppliers = async (search = '') => {
    try {
      const res = await supplierService.getSuppliers({ search, per_page: 50 });
      const list = Array.isArray(res) ? res : (res.data || []);
      const mapped = list.map(s => {
        const distanceVal = ((s.id * 4) % 12) + 1;
        return {
          id: s.id,
          supplier_name: s.supplier_name,
          description: s.description || 'Penyedia bahan baku terpercaya.',
          address: s.address || 'Alamat tidak tersedia.',
          rating: parseFloat(s.rating || 5.0),
          sirkel_score: parseInt(s.sirkel_score || 90),
          distance: `${distanceVal} km`,
          top_product: 'Bahan Baku Unggulan',
          badge: s.sirkel_score >= 90 ? 'Elite Supplier' : 'Trusted Supplier'
        };
      });
      setSuppliers(mapped);
    } catch (err) {
      console.error('Suppliers error:', err);
    }
  };

  // Load data on mount
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchGroupBuyings(),
          fetchMyOrders(),
          fetchProducts(),
          fetchBusinessInsight().then(data => {
            if (data) setAiInsight(data);
          }).catch(err => console.error('AI Insight error:', err)),
          fetchSuppliers()
        ]);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAllData();
  }, [fetchGroupBuyings, fetchMyOrders, fetchProducts, fetchBusinessInsight]);

  // Re-fetch suppliers from the server whenever the search query changes,
  // instead of only filtering the first page that was loaded on mount.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuppliers(searchQuery);
    }, 350);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Tab change with premium fake loader effect
  const handleTabChange = (tabName) => {
    setIsLoading(true);
    setActiveTab(tabName);
    setTimeout(() => {
      setIsLoading(false);
    }, 450);
  };

  // Logout handler
  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
    navigate('/login');
  };

  // Join Campaign handler
  const triggerJoinCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setJoinQuantity(Math.min(50, campaign.target_quantity - campaign.current_quantity));
    setIsJoinModalOpen(true);
  };

  const submitJoinCampaign = async () => {
    setIsJoinModalOpen(false);
    // Estimasi biaya: harga per unit × jumlah (gunakan nilai aktual jika tersedia)
    const estimatedCost = (selectedCampaign.price_per_unit || 0) * joinQuantity;
    const confirmed = await confirmGroupBuying(
      selectedCampaign.product_name,
      estimatedCost,
      selectedCampaign.deadline_days || 3
    );
    if (!confirmed) return;
    try {
      await joinGroupBuying(selectedCampaign.id, joinQuantity);
      setSuccessToastMessage(`Berhasil bergabung ke patungan ${selectedCampaign.product_name} sebanyak ${joinQuantity} unit!`);
      setIsSuccessToastVisible(true);
      setTimeout(() => setIsSuccessToastVisible(false), 4000);
      fetchGroupBuyings();
      fetchMyOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    const orderItem = recentOrders.find(o => o.rawId === orderId);
    const orderCode = orderItem ? orderItem.id : `#${orderId}`;

    const confirmed = await confirmOrderReceipt(orderCode);
    if (!confirmed) return;
    setIsLoading(true);
    try {
      await changeStatus(orderId, 'completed');
      setSuccessToastMessage("Pesanan berhasil diselesaikan!");
      setIsSuccessToastVisible(true);
      setTimeout(() => setIsSuccessToastVisible(false), 4000);
      fetchMyOrders();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Gagal menyelesaikan pesanan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBeliLangsung = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const totalAmount = (selectedProduct.price || 0) * parseInt(beliQty);
    const confirmed = await confirmB2BPurchase(
      selectedProduct.name,
      `${beliQty} ${selectedProduct.unit || 'unit'}`,
      totalAmount
    );
    if (!confirmed) return;
    setActionProcessing(true);
    try {
      const orderData = {
        product_id: selectedProduct.id,
        quantity: parseInt(beliQty),
        notes: beliNotes
      };
      await placeOrder(orderData);
      setSuccessToastMessage(`Berhasil melakukan pembelian langsung untuk ${selectedProduct.name} sebanyak ${beliQty} ${selectedProduct.unit || 'kg'}!`);
      setIsSuccessToastVisible(true);
      setTimeout(() => setIsSuccessToastVisible(false), 4000);
      setIsBeliModalOpen(false);
      setBeliQty(50);
      setBeliNotes('');
      fetchMyOrders();
    } catch (err) {
      console.error(err.response?.data?.message || 'Gagal melakukan pembelian langsung.');
    } finally {
      setActionProcessing(false);
    }
  };

  const handleBuatPatungan = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const estimatedHold = (selectedProduct.price || 0) * parseInt(patunganMin);
    const confirmed = await confirmGroupBuying(
      selectedProduct.name,
      estimatedHold,
      parseInt(patunganDeadlineDays)
    );
    if (!confirmed) return;
    setActionProcessing(true);
    try {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(patunganDeadlineDays));
      const deadlineDateStr = d.toISOString().split('T')[0];

      const campaignData = {
        product_id: selectedProduct.id,
        target_quantity: parseInt(patunganTarget),
        min_participants: parseInt(patunganMin),
        deadline: deadlineDateStr
      };
      await startGroupBuying(campaignData);
      setSuccessToastMessage(`Berhasil membuat grup patungan baru untuk ${selectedProduct.name} dengan target ${patunganTarget} ${selectedProduct.unit || 'kg'}!`);
      setIsSuccessToastVisible(true);
      setTimeout(() => setIsSuccessToastVisible(false), 4000);
      setIsPatunganModalOpen(false);
      setPatunganTarget(500);
      setPatunganMin(5);
      setPatunganDeadlineDays(3);
      fetchGroupBuyings();
    } catch (err) {
      console.error(err.response?.data?.message || 'Gagal membuat patungan baru.');
    } finally {
      setActionProcessing(false);
    }
  };

  // Derived dashboard variables
  const profile = {
    business_name: user?.profile?.business_name || user?.name || 'UMKM Owner',
    business_type: user?.profile?.business_type || 'Makanan',
    raw_material_category: user?.profile?.raw_material_category || 'Tepung',
    monthly_need_estimate: user?.profile?.monthly_need_estimate || 300
  };

  const activeGroupBuying = groupBuyings.map(c => {
    const distanceVal = ((c.id * 3) % 15) + 1;
    const savingVal = 10 + ((c.id * 2) % 11);
    return {
      ...c,
      product_name: c.product_name || c.product?.name || 'Bahan Baku',
      category: c.category || c.product?.category || 'Umum',
      potential_savings: `${savingVal}%`,
      distance: `${distanceVal} km`
    };
  });

  const activeGroupBuyingCount = activeGroupBuying.filter(c => c.status === 'open').length;
  const activeOrdersCount = orders.filter(o => o.status?.toLowerCase() !== 'completed' && o.status?.toLowerCase() !== 'cancelled').length;
  const completedGroupOrdersTotal = orders.filter(o => o.status?.toLowerCase() === 'completed' && o.type === 'group').reduce((acc, curr) => acc + Number(curr.total_price), 0);
  const savingsVal = completedGroupOrdersTotal > 0 ? Math.round(completedGroupOrdersTotal * 0.15) : 1250000;

  const stats = {
    active_group_buying: activeGroupBuyingCount,
    active_orders: activeOrdersCount,
    monthly_savings: 'Rp ' + savingsVal.toLocaleString('id-ID'),
    sirkel_score: 92
  };

  const recentOrders = orders.map(o => {
    const d = new Date(o.created_at || Date.now());
    const formattedDate = `${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })} ${d.getFullYear()}`;
    return {
      id: `ORD-${String(o.id).padStart(5, '0')}`,
      rawId: o.id,
      product: o.product?.name || 'Bahan Baku',
      supplier: o.supplier?.supplier_name || 'Supplier Mitra',
      quantity: o.quantity,
      total_price: o.total_price,
      status: o.status ? (o.status.charAt(0).toUpperCase() + o.status.slice(1)) : 'Pending',
      date: formattedDate
    };
  });

  // Suppliers are now filtered server-side (see fetchSuppliers), so we use
  // the fetched list as-is here instead of re-filtering only the first page.
  const recommendedSuppliers = suppliers;

  const filteredGroupBuying = activeGroupBuying.filter(c => {
    const matchesSearch = c.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'Semua' || c.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const filteredOrders = recentOrders.filter(o => 
    o.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Custom Chart Data for Purchase Analytics
  const lineChartData = [
    { name: 'Jan', Pengeluaran: 4200000 },
    { name: 'Feb', Pengeluaran: 3800000 },
    { name: 'Mar', Pengeluaran: 5100000 },
    { name: 'Apr', Pengeluaran: 4700000 },
    { name: 'Mei', Pengeluaran: 5900000 },
    { name: 'Jun', Pengeluaran: 6200000 }
  ];

  const barChartData = [
    { name: 'Tepung Terigu', Terbeli: 350 },
    { name: 'Tapioka', Terbeli: 220 },
    { name: 'Minyak Goreng', Terbeli: 180 },
    { name: 'Singkong', Terbeli: 420 },
    { name: 'Bawang Putih', Terbeli: 90 }
  ];

  // Helper categories for filtering
  const categories = ['Semua', 'Tepung', 'Ubi', 'Kertas', 'Minyak', 'Bumbu'];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans antialiased text-[#1E293B]">
      
      {/* SUCCESS TOAST NOTIFICATION */}
      {isSuccessToastVisible && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg transition-all duration-300 animate-fadeIn">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sm text-[#0F172A]">Aksi Berhasil</p>
            <p className="text-xs text-[#64748B]">{successToastMessage}</p>
          </div>
        </div>
      )}

      {/* SIDEBAR OVERLAY (mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#E2E8F0] bg-white px-5 py-6 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        {/* LOGO */}
        <div className="flex items-center justify-between px-2 mb-8 h-10 shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SirkelBisnis" className="h-10 w-10 rounded-xl object-cover object-top bg-white shadow-xs" />
            <div>
              <span className="font-bold text-lg tracking-tight text-[#0F172A]">Sirkel<span className="text-emerald-600">Bisnis</span></span>
              <p className="text-[10px] uppercase tracking-widest text-[#94A3B8] font-bold">UMKM Hub</p>
            </div>
          </div>
          <button className="lg:hidden text-[#64748B] hover:text-[#0F172A]" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION MENUS */}
        <nav className="flex-1 space-y-1.5 px-1 overflow-y-auto">
          <button
            onClick={() => { handleTabChange('dashboard'); setIsSidebarOpen(false); }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'}`}
          >
            <TrendingUp className="h-4.5 w-4.5" />
            Dashboard
          </button>

          <button
            onClick={() => { handleTabChange('group-buying'); setIsSidebarOpen(false); }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${activeTab === 'group-buying' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'}`}
          >
            <Users className="h-4.5 w-4.5" />
            Patungan Aktif
          </button>

          <button
            onClick={() => { handleTabChange('suppliers'); setIsSidebarOpen(false); }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${activeTab === 'suppliers' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'}`}
          >
            <Star className="h-4.5 w-4.5" />
            Cari Supplier
          </button>

          <button
            onClick={() => { handleTabChange('orders'); setIsSidebarOpen(false); }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${activeTab === 'orders' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'}`}
          >
            <ShoppingCart className="h-4.5 w-4.5" />
            Pesanan Saya
          </button>

          <button
            onClick={() => { handleTabChange('ai-insight'); setIsSidebarOpen(false); }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${activeTab === 'ai-insight' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'}`}
          >
            <Sliders className="h-4.5 w-4.5" />
            Analisis Bisnis
          </button>

          <button
            onClick={() => { handleTabChange('sirkel-score'); setIsSidebarOpen(false); }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${activeTab === 'sirkel-score' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'}`}
          >
            <Award className="h-4.5 w-4.5" />
            SirkelScore
          </button>

          <button
            onClick={() => { handleTabChange('profile'); setIsSidebarOpen(false); }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${activeTab === 'profile' ? 'bg-emerald-50 text-emerald-700' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'}`}
          >
            <User className="h-4.5 w-4.5" />
            Profil
          </button>
        </nav>

        {/* BOTTOM USER DETAILS & LOGOUT */}
        <div className="border-t border-[#E2E8F0] pt-4 mt-auto">
          <div className="flex items-center gap-3 px-2 py-1 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white font-bold text-sm shadow-sm">
              KM
            </div>
            <div className="truncate">
              <p className="font-semibold text-xs text-[#0F172A] truncate">{profile.business_name}</p>
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

      {/* MAIN CONTAINER */}
      <div className="flex-1 lg:pl-64 flex flex-col overflow-x-hidden min-h-screen">

        {/* TOP NAVBAR */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white/80 backdrop-blur-md px-8 shadow-sm">
          <div className="flex items-center gap-4">
            {/* HAMBURGER MENU (mobile) */}
            <button className="lg:hidden text-[#64748B] hover:text-[#0F172A]" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            {/* SEARCH BAR */}
            <div className="relative w-96 hidden sm:block">
              <Search className="absolute top-2.5 left-3.5 h-4.5 w-4.5 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Cari bahan baku, supplier, atau patungan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-2 pl-10 pr-4 text-xs font-medium outline-none transition-all duration-200 focus:border-[#16A34A] focus:bg-white focus:ring-1 focus:ring-[#16A34A]/25"
              />
            </div>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-4">
            
            {/* NOTIFICATIONS BELL */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative rounded-xl border border-[#E2E8F0] p-2.5 text-[#64748B] transition-all hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* NOTIFICATIONS POPOVER */}
              {isNotificationsOpen && (
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
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            markAsRead(n.id);
                            if (n.type === 'order') handleTabChange('orders');
                            if (n.type === 'patungan') handleTabChange('group-buying');
                            setIsNotificationsOpen(false);
                          }}
                          className={`flex flex-col gap-1 rounded-xl p-3.5 cursor-pointer transition-colors ${!n.read ? 'bg-green-50/20' : 'hover:bg-[#F8FAFC]'}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs ${!n.read ? 'font-bold text-[#0F172A]' : 'font-medium text-[#64748B]'}`}>{n.title}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-[#94A3B8] font-medium">{n.time}</span>
                              {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] shrink-0"></span>}
                            </div>
                          </div>
                          <p className={`text-xs leading-relaxed ${!n.read ? 'text-[#0F172A] font-medium' : 'text-[#64748B]'}`}>{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 border-l border-[#E2E8F0] pl-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-green-50 to-green-100 text-[#16A34A] font-bold text-xs">
                KM
              </div>
              <div className="text-left hidden md:block">
                <p className="font-semibold text-xs text-[#0F172A]">{profile.business_name}</p>
                <p className="text-[10px] text-[#22C55E] font-medium tracking-wide uppercase">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN DASHBOARD CONTENT */}
        <main className="p-8 space-y-8">
          
          {/* FAKE LOADER SKELETON */}
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-10 w-2/3 rounded-xl bg-[#E2E8F0]"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl bg-[#E2E8F0]"></div>)}
              </div>
              <div className="h-56 rounded-2xl bg-[#E2E8F0]"></div>
            </div>
          ) : (
            <>
              {/* TAB 1: MAIN DASHBOARD */}
              {activeTab === 'dashboard' && (
                <>
                  {/* SECTION 1: WELCOME HEADER */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h1 className="font-bold text-2xl tracking-tight text-[#0F172A] sm:text-3xl">
                        Selamat Datang, {profile.business_name}
                      </h1>
                      <p className="mt-1 text-sm text-[#64748B]">
                        Kelola pembelian bahan baku dan temukan peluang penghematan hari ini.
                      </p>
                    </div>

                    {/* QUICK ACTIONS BANNER */}
                    <div className="flex flex-wrap gap-2.5">
                      <button onClick={() => handleTabChange('group-buying')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4.5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700">
                        <Users className="h-4 w-4" />
                        Gabung Patungan
                      </button>
                      <button onClick={() => handleTabChange('suppliers')} className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4.5 py-2.5 text-xs font-semibold text-[#0F172A] shadow-sm transition hover:bg-[#F8FAFC]">
                        <Search className="h-4 w-4 text-[#64748B]" />
                        Cari Supplier
                      </button>
                    </div>
                  </div>

                  {/* SECTION 2: STATISTIC CARDS */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    
                    {/* Card 1 */}
                    <div 
                      onClick={() => handleTabChange('group-buying')}
                      className="group flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm hover:border-slate-300 transition duration-150 cursor-pointer"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Patungan Aktif</span>
                        <p className="text-2xl font-bold text-[#0F172A] tracking-tight">{stats.active_group_buying}</p>
                        <p className="text-[10px] text-emerald-600 font-medium">↑ 3 Baru minggu ini</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                        <Users className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div 
                      onClick={() => handleTabChange('orders')}
                      className="group flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm hover:border-slate-300 transition duration-150 cursor-pointer"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Pesanan Aktif</span>
                        <p className="text-2xl font-bold text-[#0F172A] tracking-tight">{stats.active_orders}</p>
                        <p className="text-[10px] text-[#64748B] font-medium">Dalam proses pengiriman</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                        <ShoppingCart className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div className="group flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm hover:border-slate-300 transition duration-150">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Penghematan</span>
                        <p className="text-xl font-bold text-emerald-600 tracking-tight">{stats.monthly_savings}</p>
                        <p className="text-[10px] text-emerald-600 font-semibold">Menghemat 18% biaya</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Wallet className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Card 4 */}
                    <div 
                      onClick={() => handleTabChange('sirkel-score')}
                      className="group flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm hover:border-slate-300 transition duration-150 cursor-pointer"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">SirkelScore</span>
                        <p className="text-2xl font-bold text-[#0F172A] tracking-tight">{stats.sirkel_score}</p>
                        <p className="text-[10px] text-emerald-600 font-semibold">Reputasi: Sangat Baik</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                        <Award className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: REKOMENDASI OPERASIONAL HERO CARD */}
                  <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 text-slate-100 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-2 rounded-full bg-slate-800 border border-slate-700/50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider w-fit text-emerald-400">
                        <TrendingUp className="h-4 w-4" />
                        Rekomendasi Operasional
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold leading-tight tracking-tight text-white">
                        Optimalkan biaya pembelian Anda minggu ini
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Prediksi Restock</p>
                          <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium">{aiInsight.restock_recommendation}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Kampanye Patungan</p>
                          <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium">{aiInsight.group_buying_recommendation}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Peluang Hemat</p>
                          <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium">{aiInsight.saving_opportunity}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Saran Operasional</p>
                          <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium">{aiInsight.business_advice}</p>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col gap-2 self-start lg:self-center">
                      <button 
                        onClick={() => handleTabChange('ai-insight')} 
                        className="rounded-2xl bg-emerald-600 px-6 py-3.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                      >
                        Lihat Detail Analisis
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>


                  {/* MIDDLE SECTION - CHARTS AND CUSTOM SCORE */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* SECTION 6: PURCHASE ANALYTICS */}
                    <div className="lg:col-span-2 rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-6">
                      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
                        <div>
                          <span className="font-bold text-sm text-[#0F172A]">Analisis Pembelian</span>
                          <p className="text-[11px] text-[#64748B]">Perbandingan tren pengeluaran dan kuantitas bahan baku</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-[#0F172A] text-center">Pengeluaran Bulanan (Rupiah)</p>
                          <div className="h-48 text-[10px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={lineChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(val) => `Rp ${val/1000000}M`} />
                                <Tooltip formatter={(val) => `Rp ${val.toLocaleString()}`} />
                                <Line type="monotone" dataKey="Pengeluaran" stroke="#16A34A" strokeWidth={3} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-[#0F172A] text-center">Kuantitas Terbanyak (kg/pcs)</p>
                          <div className="h-48 text-[10px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={barChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="Terbeli" fill="#22C55E" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 8: SIRKELSCORE Circular Card */}
                    <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-6">
                      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
                        <div>
                          <span className="font-bold text-sm text-[#0F172A]">Platform SirkelScore</span>
                          <p className="text-[11px] text-[#64748B]">Reputasi performa UMKM Anda</p>
                        </div>
                        <Award className="h-5 w-5 text-[#16A34A]" />
                      </div>

                      {/* Circular Progress Simulator */}
                      <div className="flex flex-col items-center justify-center py-2 space-y-4">
                        <div className="relative flex items-center justify-center">
                          <svg className="h-32 w-32 -rotate-90">
                            <circle cx="64" cy="64" r="54" stroke="#F1F5F9" strokeWidth="12" fill="transparent" />
                            <circle cx="64" cy="64" r="54" stroke="#16A34A" strokeWidth="12" fill="transparent" 
                                    strokeDasharray={2 * Math.PI * 54} 
                                    strokeDashoffset={2 * Math.PI * 54 * (1 - 0.92)} />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center text-center">
                            <span className="text-3xl font-extrabold text-[#0F172A]">92</span>
                            <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Skor</span>
                          </div>
                        </div>
                        
                        <div className="text-center space-y-1">
                          <p className="font-semibold text-xs text-[#0F172A]">Peringkat #8 dari 150 UMKM</p>
                          <p className="text-[10px] text-green-600 font-medium">Kepercayaan Mitra: Sangat Tinggi</p>
                        </div>
                      </div>

                      <div className="border-t border-[#F1F5F9] pt-4 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Tingkat Penyelesaian Pesanan:</span>
                          <span className="font-bold text-[#0F172A]">90%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Ketepatan Ulasan (Review):</span>
                          <span className="font-bold text-[#0F172A]">95%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Platform Aktivitas:</span>
                          <span className="font-bold text-[#0F172A]">100%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACTIVE GROUP BUYING PREVIEW AND RECENT ORDERS */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* SECTION 4: Active Group Buying Opportunities (Preview) */}
                    <div className="lg:col-span-1 rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-6">
                      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
                        <div>
                          <span className="font-bold text-sm text-[#0F172A]">Patungan Terdekat</span>
                          <p className="text-[11px] text-[#64748B]">Peluang hemat bersama</p>
                        </div>
                        <button onClick={() => handleTabChange('group-buying')} className="text-xs font-semibold text-[#16A34A] hover:underline flex items-center gap-1">
                          Semua
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        {activeGroupBuying.slice(0, 2).map(c => (
                          <div key={c.id} className="rounded-2xl border border-[#F1F5F9] p-4 space-y-3 transition hover:border-green-200">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-bold text-xs text-[#0F172A]">{c.product_name}</span>
                                <p className="text-[10px] text-[#94A3B8]">Kategori: {c.category}</p>
                              </div>
                              <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                Hemat {c.potential_savings}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-[#64748B]">
                                <span>Progres: {c.current_quantity} / {c.target_quantity} kg</span>
                                <span>{Math.round((c.current_quantity / c.target_quantity) * 100)}%</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
                                <div className="h-full bg-[#16A34A] rounded-full" style={{ width: `${(c.current_quantity / c.target_quantity) * 100}%` }}></div>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-[10px] text-[#64748B] pt-1">
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.distance}</span>
                              <span>Sisa: 2 Hari</span>
                            </div>

                            <button 
                              onClick={() => triggerJoinCampaign(c)}
                              className="w-full rounded-xl bg-[#16A34A]/10 py-2 text-center text-xs font-bold text-[#16A34A] hover:bg-[#16A34A] hover:text-white transition"
                            >
                              Gabung Patungan
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 7: Recent Orders (Preview) */}
                    <div className="lg:col-span-2 rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-6">
                      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
                        <div>
                          <span className="font-bold text-sm text-[#0F172A]">Transaksi Terbaru</span>
                          <p className="text-[11px] text-[#64748B]">Log pembelian bahan baku Anda</p>
                        </div>
                        <button onClick={() => handleTabChange('orders')} className="text-xs font-semibold text-[#16A34A] hover:underline flex items-center gap-1">
                          Lihat Pesanan
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[#F1F5F9] text-[#64748B] font-semibold">
                              <th className="pb-3">Order ID</th>
                              <th className="pb-3">Produk</th>
                              <th className="pb-3">Supplier</th>
                              <th className="pb-3">Status</th>
                              <th className="pb-3">Tanggal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F8FAFC]">
                            {recentOrders.slice(0, 4).map(o => (
                              <tr key={o.id} className="hover:bg-[#F8FAFC]">
                                <td className="py-3 font-semibold text-[#16A34A]">{o.id}</td>
                                <td className="py-3 font-semibold text-[#0F172A]">{o.product}</td>
                                <td className="py-3 text-[#64748B]">{o.supplier}</td>
                                <td className="py-3">
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                    o.status === 'Completed' ? 'bg-green-50 text-green-700' :
                                    o.status === 'Shipped' ? 'bg-blue-50 text-blue-700' :
                                    o.status === 'Processing' ? 'bg-yellow-50 text-yellow-700' :
                                    'bg-gray-50 text-gray-700'
                                  }`}>
                                    {o.status}
                                  </span>
                                </td>
                                <td className="py-3 text-[#94A3B8]">{o.date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: ACTIVE GROUP BUYING */}
              {activeTab === 'group-buying' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-black text-xl text-[#0F172A] tracking-tight sm:text-2xl">
                      Patungan Aktif di Sekitar Anda
                    </h2>
                    <p className="text-xs text-[#64748B]">Temukan dan bergabunglah dalam pembelian kolektif terdekat untuk diskon harga volume.</p>
                  </div>

                  {/* Filters bar */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-between border-b border-[#F1F5F9] pb-4">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`rounded-xl px-4.5 py-2 text-xs font-semibold border transition ${
                            categoryFilter === cat ? 'bg-[#16A34A] text-white border-[#16A34A]' : 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                    {filteredGroupBuying.map(c => (
                        <div key={c.id} className="rounded-3xl border border-[#E2E8F0] bg-white p-6 space-y-4 hover:shadow-md transition duration-200">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-bold text-sm text-[#0F172A]">{c.product_name}</span>
                              <p className="text-[10px] text-[#94A3B8]">Kategori: {c.category}</p>
                            </div>
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                              Hemat {c.potential_savings}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-[#64748B]">
                              <span>Progres kuantitas:</span>
                              <span className="font-bold text-[#0F172A]">{c.current_quantity} / {c.target_quantity} kg</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
                              <div className="h-full bg-[#16A34A] rounded-full" style={{ width: `${(c.current_quantity / c.target_quantity) * 100}%` }}></div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs border-t border-b border-[#F8FAFC] py-3 text-[#64748B]">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-[#94A3B8]">Jarak:</span>
                              <p className="font-semibold text-[#0F172A] flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[#16A34A]" /> {c.distance}</p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-[#94A3B8]">Sisa Waktu:</span>
                              <p className="font-semibold text-[#0F172A]">2 Hari</p>
                            </div>
                          </div>

                          <button 
                            onClick={() => triggerJoinCampaign(c)}
                            className="w-full rounded-2xl bg-[#16A34A] py-3 text-center text-xs font-bold text-white shadow-md shadow-green-100 hover:bg-[#15803D] transition"
                          >
                            Gabung Sekarang
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TAB 3: RECOMMENDED SUPPLIERS */}
              {activeTab === 'suppliers' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-black text-xl text-[#0F172A] tracking-tight sm:text-2xl">
                      Supplier Rekomendasi
                    </h2>
                    <p className="text-xs text-[#64748B]">Kemitraan aman terintegrasi platform SirkelScore untuk kestabilan pasokan Anda.</p>
                  </div>

                  {/* Grid layouts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                    {recommendedSuppliers.map(s => (
                      <div key={s.id} className="rounded-3xl border border-[#E2E8F0] bg-white p-6 space-y-4 hover:shadow-md transition duration-200 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-bold text-sm text-[#0F172A]">{s.supplier_name}</span>
                              <div className="flex items-center gap-1.5 mt-1 text-xs">
                                <div className="flex text-amber-400">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                                  ))}
                                </div>
                                <span className="font-bold text-[#0F172A]">{s.rating}</span>
                              </div>
                            </div>

                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                              s.badge === 'Elite Supplier' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {s.badge}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs bg-[#F8FAFC] p-3 rounded-2xl">
                            <div>
                              <span className="text-[10px] text-[#94A3B8]">SirkelScore:</span>
                              <p className="font-extrabold text-[#16A34A] text-sm">{s.sirkel_score} / 100</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#94A3B8]">Produk Unggulan:</span>
                              <p className="font-bold text-[#0F172A] truncate">{s.top_product}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-[#F1F5F9] pt-4 mt-2">
                          <span className="text-xs text-[#64748B] flex items-center gap-1"><MapPin className="h-4 w-4" /> {s.distance}</span>
                          <button 
                            onClick={() => openSupplierModal(s)}
                            className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition"
                          >
                            Lihat Supplier
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: MY ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-black text-xl text-[#0F172A] tracking-tight sm:text-2xl">
                      Riwayat Pesanan Anda
                    </h2>
                    <p className="text-xs text-[#64748B]">Pantau progres pengiriman bahan baku yang sedang aktif maupun telah selesai.</p>
                  </div>

                  <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                          <th className="pb-4">Order ID</th>
                          <th className="pb-4">Produk</th>
                          <th className="pb-4">Supplier</th>
                          <th className="pb-4">Jumlah</th>
                          <th className="pb-4">Total</th>
                          <th className="pb-4">Status</th>
                          <th className="pb-4">Tanggal Pemesanan</th>
                          <th className="pb-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F8FAFC]">
                        {filteredOrders.map(o => (
                          <tr key={o.id} className="hover:bg-[#F8FAFC]">
                            <td className="py-4 font-bold text-[#16A34A]">{o.id}</td>
                            <td className="py-4 font-bold text-[#0F172A]">{o.product}</td>
                            <td className="py-4 text-[#64748B]">{o.supplier}</td>
                            <td className="py-4 font-semibold text-[#0F172A]">{o.quantity} kg</td>
                            <td className="py-4 font-bold text-[#0F172A]">Rp {o.total_price.toLocaleString()}</td>
                            <td className="py-4">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                o.status === 'Completed' ? 'bg-green-50 text-green-700' :
                                o.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' :
                                o.status === 'Shipped' ? 'bg-blue-50 text-blue-700' :
                                o.status === 'Processing' ? 'bg-yellow-50 text-yellow-700' :
                                'bg-gray-50 text-gray-700'
                              }`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="py-4 text-[#94A3B8]">{o.date}</td>
                            <td className="py-4 text-right">
                              {o.status === 'Shipped' && (
                                <button
                                  onClick={() => handleCompleteOrder(o.rawId)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                                >
                                  Terima Barang
                                </button>
                              )}
                              {o.status !== 'Shipped' && <span className="text-[#94A3B8]">-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: ANALISIS BISNIS */}
              {activeTab === 'ai-insight' && (
                <div className="space-y-6 max-w-4xl">
                  <div>
                    <h2 className="font-black text-xl text-[#0F172A] tracking-tight sm:text-2xl">
                      Analisis & Rekomendasi Bisnis
                    </h2>
                    <p className="text-xs text-[#64748B]">Prediksi kebutuhan stok dan peluang penghematan operasional berdasarkan analisis data transaksi.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 space-y-4">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                        <TrendingUp className="h-4.5 w-4.5" />
                        Status Operasional & Stok
                      </div>
                      <p className="text-xs text-[#64748B] leading-relaxed">{aiInsight.business_condition}</p>
                    </div>

                    <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 space-y-4">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                        <Wallet className="h-4.5 w-4.5" />
                        Peluang Penghematan Biaya
                      </div>
                      <p className="text-xs text-[#64748B] leading-relaxed">{aiInsight.saving_opportunity}</p>
                    </div>

                    <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 space-y-4">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                        <Users className="h-4.5 w-4.5" />
                        Rekomendasi Kampanye Patungan
                      </div>
                      <p className="text-xs text-[#64748B] leading-relaxed">{aiInsight.group_buying_recommendation}</p>
                    </div>

                    <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 space-y-4">
                      <div className="flex items-center gap-2 text-red-600 font-bold text-xs">
                        <AlertTriangle className="h-4.5 w-4.5" />
                        Prediksi Restock & Kekurangan Stok
                      </div>
                      <p className="text-xs text-[#64748B] leading-relaxed">{aiInsight.restock_recommendation}</p>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-6 space-y-2">
                    <span className="font-extrabold text-emerald-800 text-xs">Rekomendasi Operasional Utama</span>
                    <p className="text-xs text-emerald-950 leading-relaxed font-semibold">{aiInsight.business_advice}</p>
                  </div>
                </div>
              )}

              {/* TAB 6: SIRKEL SCORE */}
              {activeTab === 'sirkel-score' && (
                <div className="space-y-6 max-w-3xl">
                  <div>
                    <h2 className="font-black text-xl text-[#0F172A] tracking-tight sm:text-2xl">
                      Reputasi SirkelScore Anda
                    </h2>
                    <p className="text-xs text-[#64748B]">Indeks performa interaksi rantai pasok Anda pada sirkel bisnis.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center rounded-3xl border border-[#E2E8F0] bg-white p-8">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative flex items-center justify-center">
                        <svg className="h-40 w-40 -rotate-90">
                          <circle cx="80" cy="80" r="70" stroke="#F1F5F9" strokeWidth="15" fill="transparent" />
                          <circle cx="80" cy="80" r="70" stroke="#16A34A" strokeWidth="15" fill="transparent" 
                                  strokeDasharray={2 * Math.PI * 70} 
                                  strokeDashoffset={2 * Math.PI * 70 * (1 - 0.92)} />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className="text-4xl font-black text-[#0F172A]">92</span>
                          <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Skor</span>
                        </div>
                      </div>
                      <p className="font-bold text-sm text-[#0F172A]">Skor Reputasi Sangat Baik</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-[#0F172A]">
                          <span>Tingkat Penyelesaian Pesanan</span>
                          <span>90%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-[#16A34A]" style={{ width: '90%' }}></div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-[#0F172A]">
                          <span>Kecepatan Review Supplier</span>
                          <span>95%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-[#16A34A]" style={{ width: '95%' }}></div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-[#0F172A]">
                          <span>Keaktifan Patungan Kolektif</span>
                          <span>100%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-[#16A34A]" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: PROFILE */}
              {activeTab === 'profile' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h2 className="font-black text-xl text-[#0F172A] tracking-tight sm:text-2xl">
                      Profil Usaha UMKM
                    </h2>
                    <p className="text-xs text-[#64748B]">Detail profil bisnis terdaftar Anda di ekosistem supply chain.</p>
                  </div>

                  <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 space-y-4 text-xs text-[#64748B]">
                    <div className="grid grid-cols-2 gap-4 pb-3 border-b border-[#F8FAFC]">
                      <span className="font-semibold text-slate-500">Nama Usaha:</span>
                      <span className="font-bold text-[#0F172A]">{profile.business_name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pb-3 border-b border-[#F8FAFC]">
                      <span className="font-semibold text-slate-500">Tipe Usaha:</span>
                      <span className="font-bold text-[#0F172A]">{profile.business_type}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pb-3 border-b border-[#F8FAFC]">
                      <span className="font-semibold text-slate-500">Kategori Bahan Baku Utama:</span>
                      <span className="font-bold text-[#0F172A]">{profile.raw_material_category}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <span className="font-semibold text-slate-500">Kebutuhan Bulanan (Estimasi):</span>
                      <span className="font-bold text-[#0F172A]">{profile.monthly_need_estimate} kg</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </main>
      </div>

      {/* JOIN CAMPAIGN DIALOG MODAL */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-2xl animate-scaleUp">
            <h3 className="font-black text-lg text-[#0F172A] mb-2">Ikut Patungan</h3>
            <p className="text-xs text-[#64748B] mb-4">Bergabung ke dalam pembelian kolektif {selectedCampaign?.product_name}.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Jumlah Gabungan (kg)</label>
                <input 
                  type="number" 
                  value={joinQuantity}
                  onChange={(e) => setJoinQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]/25"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button 
                  onClick={() => setIsJoinModalOpen(false)}
                  className="flex-1 rounded-xl border border-[#E2E8F0] bg-white py-2.5 text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC]"
                >
                  Batal
                </button>
                <button 
                  onClick={submitJoinCampaign}
                  className="flex-1 rounded-xl bg-[#16A34A] py-2.5 text-center text-xs font-bold text-white hover:bg-[#15803D]"
                >
                  Konfirmasi Gabung
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BELI LANGSUNG MODAL */}
      {isBeliModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleBeliLangsung} className="w-full max-w-md rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-2xl animate-scaleUp space-y-4">
            <div>
              <h3 className="font-black text-lg text-[#0F172A]">Beli Langsung</h3>
              <p className="text-xs text-[#64748B] mt-1">Pembelian ritel instan untuk produk <strong>{selectedProduct.name}</strong>.</p>
            </div>

            <div className="space-y-3 text-xs text-[#64748B]">
              <div className="flex justify-between">
                <span>Harga Satuan:</span>
                <span className="font-bold text-[#0F172A]">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(selectedProduct.price)}/{selectedProduct.unit}</span>
              </div>
              <div className="flex justify-between">
                <span>Sisa Stok:</span>
                <span className="font-bold text-[#0F172A]">{selectedProduct.stock} {selectedProduct.unit}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">Jumlah Kebutuhan ({selectedProduct.unit})</label>
                <input 
                  type="number" 
                  value={beliQty}
                  onChange={(e) => setBeliQty(Math.max(1, Math.min(selectedProduct.stock, parseInt(e.target.value) || 1)))}
                  className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]/25 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">Catatan Pengiriman (Opsional)</label>
                <textarea 
                  value={beliNotes}
                  onChange={(e) => setBeliNotes(e.target.value)}
                  placeholder="Contoh: Kirim pagi hari, pastikan kemasan rapat..."
                  className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]/25"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => setIsBeliModalOpen(false)}
                className="flex-1 rounded-xl border border-[#E2E8F0] bg-white py-2.5 text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC]"
                disabled={actionProcessing}
              >
                Batal
              </button>
              <button 
                type="submit"
                className="flex-1 rounded-xl bg-[#16A34A] py-2.5 text-center text-xs font-bold text-white hover:bg-[#15803D] disabled:bg-[#16A34A]/50"
                disabled={actionProcessing}
              >
                {actionProcessing ? 'Memproses...' : 'Beli Sekarang'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BUAT PATUNGAN MODAL */}
      {isPatunganModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleBuatPatungan} className="w-full max-w-md rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-2xl animate-scaleUp space-y-4">
            <div>
              <h3 className="font-black text-lg text-[#0F172A]">Mulai Program Patungan</h3>
              <p className="text-xs text-[#64748B] mt-1">Inisiasi kelompok patungan baru untuk produk <strong>{selectedProduct.name}</strong>.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">Target Total Kuantitas ({selectedProduct.unit})</label>
                <input 
                  type="number" 
                  value={patunganTarget}
                  onChange={(e) => setPatunganTarget(Math.max(10, parseInt(e.target.value) || 10))}
                  placeholder="Contoh: 500"
                  className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]/25 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">Minimal Peserta (UMKM)</label>
                <input 
                  type="number" 
                  value={patunganMin}
                  onChange={(e) => setPatunganMin(Math.max(2, parseInt(e.target.value) || 2))}
                  placeholder="Contoh: 5"
                  className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]/25 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">Batas Waktu (Deadline Hari)</label>
                <select 
                  value={patunganDeadlineDays}
                  onChange={(e) => setPatunganDeadlineDays(parseInt(e.target.value))}
                  className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]/25 bg-white font-bold text-[#0F172A]"
                  required
                >
                  <option value={1}>1 Hari</option>
                  <option value={2}>2 Hari</option>
                  <option value={3}>3 Hari</option>
                  <option value={5}>5 Hari</option>
                  <option value={7}>7 Hari</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => setIsPatunganModalOpen(false)}
                className="flex-1 rounded-xl border border-[#E2E8F0] bg-white py-2.5 text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC]"
                disabled={actionProcessing}
              >
                Batal
              </button>
              <button 
                type="submit"
                className="flex-1 rounded-xl bg-[#16A34A] py-2.5 text-center text-xs font-bold text-white hover:bg-[#15803D] disabled:bg-[#16A34A]/50"
                disabled={actionProcessing}
              >
                {actionProcessing ? 'Memproses...' : 'Buat Patungan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DETAIL SUPPLIER MODAL */}
      {isSupplierModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-2xl animate-scaleUp space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header / Profile */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#F1F5F9]">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-xl font-black text-[#0F172A]">{selectedSupplier.supplier_name}</h3>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    selectedSupplier.badge === 'Elite Supplier' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedSupplier.badge}
                  </span>
                  <span className="inline-flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    <Star className="h-3 w-3 fill-current text-amber-500" />
                    <span>{selectedSupplier.rating}</span>
                  </span>
                </div>
                <p className="text-xs text-[#64748B] max-w-2xl">{selectedSupplier.description}</p>
                <div className="flex items-center gap-4 text-[11px] text-[#94A3B8] font-semibold">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {selectedSupplier.address}</span>
                  <span>•</span>
                  <span>Jarak: {selectedSupplier.distance}</span>
                </div>
              </div>

              {/* SirkelScore circular/badge representation */}
              <div className="flex items-center gap-3 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] shrink-0">
                <Award className="h-8 w-8 text-[#16A34A] shrink-0" />
                <div>
                  <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">SirkelScore</span>
                  <span className="text-lg font-black text-[#16A34A]">{selectedSupplier.sirkel_score} / 100</span>
                </div>
              </div>
            </div>

            {/* Products List Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-[#0F172A]">Bahan Baku yang Dijual</h4>
                <span className="text-[10px] text-[#94A3B8] font-bold uppercase">
                  {supplierProducts.length} Produk Terdaftar
                </span>
              </div>

              {supplierProductsLoading ? (
                <div className="rounded-3xl border border-dashed border-[#E2E8F0] p-8 text-center text-xs text-[#94A3B8] font-bold">
                  Memuat produk...
                </div>
              ) : supplierProducts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#E2E8F0] p-8 text-center text-xs text-[#94A3B8] font-bold">
                  Belum ada produk terdaftar dari supplier ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {supplierProducts.map(prod => (
                    <div key={prod.id} className="rounded-3xl border border-[#E2E8F0] bg-white p-4 space-y-3 hover:shadow-md transition duration-200 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="aspect-video w-full rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden relative">
                          {prod.image ? (
                            <img src={prod.image} alt={prod.name} className="object-cover w-full h-full" />
                          ) : (
                            <div className="text-center p-2">
                              <span className="font-black text-emerald-600 text-base">{prod.name.charAt(0)}</span>
                            </div>
                          )}
                          <span className="absolute bottom-2 right-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                            {prod.category}
                          </span>
                        </div>
                        
                        <div>
                          <h5 className="font-bold text-xs text-[#0F172A] line-clamp-1">{prod.name}</h5>
                          <p className="text-xs font-extrabold text-[#16A34A] mt-1">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(prod.price)}
                            <span className="text-[10px] text-[#64748B] font-medium">/{prod.unit || 'kg'}</span>
                          </p>
                        </div>
                        
                        <div className="text-[10px] text-[#64748B] flex items-center justify-between border-t border-[#F8FAFC] pt-2">
                          <span>Stok: <strong className="text-[#0F172A]">{prod.stock} {prod.unit || 'kg'}</strong></span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F8FAFC]">
                        <button 
                          onClick={() => { setSelectedProduct(prod); setIsBeliModalOpen(true); setIsSupplierModalOpen(false); }}
                          className="rounded-xl border border-[#E2E8F0] py-2 text-center text-[10px] font-bold text-[#0F172A] hover:bg-[#F8FAFC] transition"
                        >
                          Beli Ritel
                        </button>
                        <button 
                          onClick={() => { setSelectedProduct(prod); setIsPatunganModalOpen(true); setIsSupplierModalOpen(false); }}
                          className="rounded-xl bg-[#16A34A] py-2 text-center text-[10px] font-bold text-white hover:bg-[#15803D] transition shadow-sm"
                        >
                          Buat Patungan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-4 border-t border-[#F1F5F9]">
              <button 
                type="button"
                onClick={() => setIsSupplierModalOpen(false)}
                className="rounded-xl border border-[#E2E8F0] bg-white px-6 py-2.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UMKM CONFIRMATION MODAL - Global, rendered once, driven by useConfirmPopup hook */}
      <ConfirmModal {...modalProps} />

    </div>
  );
}
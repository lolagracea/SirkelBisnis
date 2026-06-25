import React, { useState, useEffect } from 'react';
useApp();
import { useForm, router } from '@inertiajs/react';
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
  ChevronDown
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

function useApp() {
  // Empty helper to satisfy the eslint rule for react imports
}

export default function Dashboard({ auth, profile, stats, activeGroupBuying = [], recommendedSuppliers = [], recentOrders = [], aiInsight }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [orderFilter, setOrderFilter] = useState('all');

  // Input states for modal forms (Mocking Action handlers)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [joinQuantity, setJoinQuantity] = useState(10);
  const [isSuccessToastVisible, setIsSuccessToastVisible] = useState(false);
  const [successToastMessage, setSuccessToastMessage] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'AI Insight Baru', message: 'Stok singkong diperkirakan habis dalam 6 hari. Disarankan restock.', time: '5 mnt lalu', read: false },
    { id: 2, title: 'Patungan Berhasil', message: 'Patungan Tepung Tapioka mencapai target dan siap dikirim!', time: '1 jam lalu', read: false },
    { id: 3, title: 'Supplier Terverifikasi', message: 'CV Tani Sejahtera kini berstatus Elite Supplier.', time: '1 hari lalu', read: true }
  ]);
  const unreadCount = notifications.filter(n => !n.read).length;

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

  // Tab change with premium fake loader effect
  const handleTabChange = (tabName) => {
    setIsLoading(true);
    setActiveTab(tabName);
    setTimeout(() => {
      setIsLoading(false);
    }, 450);
  };

  // Logout handler
  const handleLogout = (e) => {
    e.preventDefault();
    router.post(route('logout'));
  };

  // Join Campaign handler
  const triggerJoinCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setJoinQuantity(Math.min(50, campaign.target_quantity - campaign.current_quantity));
    setIsJoinModalOpen(true);
  };

  const submitJoinCampaign = () => {
    setIsJoinModalOpen(false);
    // Dynamic updates for local feedback
    setSuccessToastMessage(`Berhasil bergabung ke patungan ${selectedCampaign.product_name} sebanyak ${joinQuantity} unit!`);
    setIsSuccessToastVisible(true);
    setTimeout(() => setIsSuccessToastVisible(false), 4000);
  };

  // Helper categories for filtering
  const categories = ['Semua', 'Tepung', 'Ubi', 'Kertas', 'Minyak', 'Bumbu'];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans antialiased text-[#1E293B]">
      
      {/* SUCCESS TOAST NOTIFICATION */}
      {isSuccessToastVisible && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-green-200 bg-white p-4 shadow-2xl transition-all duration-300 animate-bounce">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sm text-[#0F172A]">Aksi Berhasil</p>
            <p className="text-xs text-[#64748B]">{successToastMessage}</p>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-[#E2E8F0] bg-white px-5 py-6">
        {/* LOGO */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#16A34A] to-[#22C55E] text-white shadow-md shadow-green-200">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-[#0F172A]">Sirkel<span className="text-[#16A34A]">Bisnis</span></span>
            <p className="text-[10px] uppercase tracking-widest text-[#94A3B8] font-bold">UMKM Hub</p>
          </div>
        </div>

        {/* NAVIGATION MENUS */}
        <nav className="flex-1 space-y-1.5 px-1">
          <button 
            onClick={() => handleTabChange('dashboard')}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'}`}
          >
            <TrendingUp className="h-4.5 w-4.5" />
            Dashboard
          </button>
          
          <button 
            onClick={() => handleTabChange('group-buying')}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${activeTab === 'group-buying' ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'}`}
          >
            <Users className="h-4.5 w-4.5" />
            Patungan Aktif
          </button>

          <button 
            onClick={() => handleTabChange('suppliers')}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${activeTab === 'suppliers' ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'}`}
          >
            <Star className="h-4.5 w-4.5" />
            Cari Supplier
          </button>

          <button 
            onClick={() => handleTabChange('orders')}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${activeTab === 'orders' ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'}`}
          >
            <ShoppingCart className="h-4.5 w-4.5" />
            Pesanan Saya
          </button>

          <button 
            onClick={() => handleTabChange('ai-insight')}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${activeTab === 'ai-insight' ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'}`}
          >
            <Sparkles className="h-4.5 w-4.5 text-[#22C55E]" />
            AI Insight
          </button>

          <button 
            onClick={() => handleTabChange('sirkel-score')}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${activeTab === 'sirkel-score' ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'}`}
          >
            <Award className="h-4.5 w-4.5" />
            SirkelScore
          </button>

          <button 
            onClick={() => handleTabChange('profile')}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-sm transition-all duration-200 ${activeTab === 'profile' ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'}`}
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
              <p className="text-[10px] text-[#64748B] truncate">{auth.user.email}</p>
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
      <div className="flex-1 pl-64">
        
        {/* TOP NAVBAR */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white/80 backdrop-blur-md px-8 shadow-sm">
          {/* SEARCH BAR */}
          <div className="relative w-96">
            <Search className="absolute top-2.5 left-3.5 h-4.5 w-4.5 text-[#94A3B8]" />
            <input 
              type="text" 
              placeholder="Cari bahan baku, supplier, atau patungan..."
              className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-2 pl-10 pr-4 text-xs font-medium outline-none transition-all duration-200 focus:border-[#16A34A] focus:bg-white focus:ring-1 focus:ring-[#16A34A]/25"
            />
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
                <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-2xl ring-1 ring-[#0F172A]/5 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2 mb-3">
                    <span className="font-bold text-sm text-[#0F172A]">Notifikasi</span>
                    <button className="text-[10px] font-bold text-[#16A34A] hover:underline">Tandai semua dibaca</button>
                  </div>
                  <div className="space-y-3">
                    {notifications.map(n => (
                      <div key={n.id} className="flex flex-col gap-1 rounded-xl p-2 transition hover:bg-[#F8FAFC]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-[#0F172A]">{n.title}</span>
                          <span className="text-[9px] text-[#94A3B8]">{n.time}</span>
                        </div>
                        <p className="text-xs text-[#64748B] leading-relaxed">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AVATAR BADGE */}
            <div className="flex items-center gap-3 border-l border-[#E2E8F0] pl-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-green-50 to-green-100 text-[#16A34A] font-bold text-xs">
                KM
              </div>
              <div className="text-left hidden md:block">
                <p className="font-semibold text-xs text-[#0F172A]">{profile.business_name}</p>
                <p className="text-[10px] text-[#22C55E] font-medium tracking-wide uppercase">{auth.user.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN DASHBOARD CONTENT */}
        <main className="p-8 max-w-7xl mx-auto space-y-8">
          
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
                      <h1 className="font-black text-2xl tracking-tight text-[#0F172A] sm:text-3xl">
                        Selamat Datang, {profile.business_name} 👋
                      </h1>
                      <p className="mt-1 text-sm text-[#64748B]">
                        Kelola pembelian bahan baku dan temukan peluang penghematan hari ini.
                      </p>
                    </div>

                    {/* QUICK ACTIONS BANNER */}
                    <div className="flex flex-wrap gap-2.5">
                      <button onClick={() => handleTabChange('group-buying')} className="inline-flex items-center gap-2 rounded-xl bg-[#16A34A] px-4.5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-green-200 transition-all hover:bg-[#15803D] hover:scale-[1.02]">
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
                      className="group flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Patungan Aktif</span>
                        <p className="text-2xl font-bold text-[#0F172A] tracking-tight">{stats.active_group_buying}</p>
                        <p className="text-[10px] text-green-600 font-medium">↑ 3 Baru minggu ini</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-[#16A34A] transition group-hover:bg-[#16A34A] group-hover:text-white">
                        <Users className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div 
                      onClick={() => handleTabChange('orders')}
                      className="group flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Pesanan Aktif</span>
                        <p className="text-2xl font-bold text-[#0F172A] tracking-tight">{stats.active_orders}</p>
                        <p className="text-[10px] text-[#64748B] font-medium">Dalam proses pengiriman</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-[#16A34A] transition group-hover:bg-[#16A34A] group-hover:text-white">
                        <ShoppingCart className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div className="group flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Penghematan</span>
                        <p className="text-xl font-black text-[#16A34A] tracking-tight">{stats.monthly_savings}</p>
                        <p className="text-[10px] text-green-600 font-semibold">Menghemat 18% biaya</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-[#16A34A] transition group-hover:bg-[#16A34A] group-hover:text-white">
                        <Wallet className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Card 4 */}
                    <div 
                      onClick={() => handleTabChange('sirkel-score')}
                      className="group flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">SirkelScore</span>
                        <p className="text-2xl font-bold text-[#0F172A] tracking-tight">{stats.sirkel_score}</p>
                        <p className="text-[10px] text-[#16A34A] font-semibold">Reputasi: Sangat Baik</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-[#16A34A] transition group-hover:bg-[#16A34A] group-hover:text-white">
                        <Award className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: AI INSIGHT HERO CARD */}
                  <div className="rounded-3xl bg-gradient-to-r from-[#16A34A] to-[#15803D] p-8 text-white shadow-xl shadow-green-100 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-white/5 -translate-y-10 translate-x-10"></div>
                    <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-white/5 translate-y-10 -translate-x-10"></div>
                    
                    <div className="space-y-4 max-w-2xl">
                      <div className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider w-fit">
                        <Sparkles className="h-4 w-4 text-green-200" />
                        AI Insight Terkini
                      </div>
                      <h2 className="text-xl md:text-2xl font-black leading-tight tracking-tight">
                        Optimalkan biaya pembelian Anda minggu ini
                      </h2>
                      <div className="space-y-2 text-xs md:text-sm text-green-50 leading-relaxed font-medium">
                        <p>• {aiInsight.restock_recommendation}</p>
                        <p>• {aiInsight.group_buying_recommendation}</p>
                        <p>• {aiInsight.saving_opportunity}</p>
                        <p>• <span className="font-bold text-white">Saran Bisnis:</span> {aiInsight.business_advice}</p>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col gap-2">
                      <button 
                        onClick={() => handleTabChange('ai-insight')} 
                        className="rounded-2xl bg-white px-6 py-3.5 text-xs font-bold text-[#16A34A] shadow-md hover:bg-green-50 hover:scale-[1.03] transition-all flex items-center justify-center gap-2"
                      >
                        Lihat Detail AI
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
                    {activeGroupBuying
                      .filter(c => categoryFilter === 'Semua' || c.category.toLowerCase() === categoryFilter.toLowerCase())
                      .map(c => (
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
                          <button className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition">
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
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F8FAFC]">
                        {recentOrders.map(o => (
                          <tr key={o.id} className="hover:bg-[#F8FAFC]">
                            <td className="py-4 font-bold text-[#16A34A]">{o.id}</td>
                            <td className="py-4 font-bold text-[#0F172A]">{o.product}</td>
                            <td className="py-4 text-[#64748B]">{o.supplier}</td>
                            <td className="py-4 font-semibold text-[#0F172A]">{o.quantity} kg</td>
                            <td className="py-4 font-bold text-[#0F172A]">Rp {o.total_price.toLocaleString()}</td>
                            <td className="py-4">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                o.status === 'Completed' ? 'bg-green-50 text-green-700' :
                                o.status === 'Shipped' ? 'bg-blue-50 text-blue-700' :
                                o.status === 'Processing' ? 'bg-yellow-50 text-yellow-700' :
                                'bg-gray-50 text-gray-700'
                              }`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="py-4 text-[#94A3B8]">{o.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: AI INSIGHTS */}
              {activeTab === 'ai-insight' && (
                <div className="space-y-6 max-w-4xl">
                  <div>
                    <h2 className="font-black text-xl text-[#0F172A] tracking-tight sm:text-2xl">
                      AI Wawasan Bisnis
                    </h2>
                    <p className="text-xs text-[#64748B]">Saran prediktif kecerdasan buatan Gemini AI berdasarkan riwayat transaksi.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 space-y-4">
                      <div className="flex items-center gap-2 text-[#16A34A] font-bold text-xs">
                        <Sparkles className="h-4.5 w-4.5" />
                        Kondisi Pembelian & Kebutuhan
                      </div>
                      <p className="text-xs text-[#64748B] leading-relaxed">{aiInsight.business_condition}</p>
                    </div>

                    <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 space-y-4">
                      <div className="flex items-center gap-2 text-[#16A34A] font-bold text-xs">
                        <Wallet className="h-4.5 w-4.5" />
                        Peluang Penghematan Biaya
                      </div>
                      <p className="text-xs text-[#64748B] leading-relaxed">{aiInsight.saving_opportunity}</p>
                    </div>

                    <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 space-y-4">
                      <div className="flex items-center gap-2 text-[#16A34A] font-bold text-xs">
                        <Users className="h-4.5 w-4.5" />
                        Rekomendasi Kampanye Patungan
                      </div>
                      <p className="text-xs text-[#64748B] leading-relaxed">{aiInsight.group_buying_recommendation}</p>
                    </div>

                    <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 space-y-4">
                      <div className="flex items-center gap-2 text-red-600 font-bold text-xs">
                        <AlertTriangle className="h-4.5 w-4.5 animate-bounce" />
                        Prediksi Depletion & Restock
                      </div>
                      <p className="text-xs text-[#64748B] leading-relaxed">{aiInsight.restock_recommendation}</p>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-green-50 border border-green-100 p-6 space-y-2">
                    <span className="font-extrabold text-[#16A34A] text-xs">AI Rekomendasi Bisnis Teratas</span>
                    <p className="text-xs text-green-900 leading-relaxed font-semibold">{aiInsight.business_advice}</p>
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

    </div>
  );
}

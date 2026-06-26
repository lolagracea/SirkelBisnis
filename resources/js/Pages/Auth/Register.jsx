import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, User, AlertTriangle, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import Select from 'react-select';

export default function Register() {
  const { registerUmkm, registerSupplier } = useAuth();
  const navigate = useNavigate();
  
  const [role, setRole] = useState('umkm'); // 'umkm' or 'supplier'
  const [formData, setFormData] = useState({
    name: '',
    nik: '',
    phone_number: '',
    password: '',
    password_confirmation: '',
    // UMKM fields
    business_name: '',
    business_type: '',
    business_address: '',
    district_city: '',
    raw_material_category: '',
    monthly_need_estimate: '',
    // Supplier fields
    supplier_name: '',
    address: '',
    description: '',
    latitude: '-7.983', // Default Malang
    longitude: '112.621'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  
  // Data for combobox
  const [cities, setCities] = useState([]);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBusinessTypes, setLoadingBusinessTypes] = useState(false);

  useEffect(() => {
    const fetchReferenceData = async () => {
      setLoadingCities(true);
      setLoadingBusinessTypes(true);
      try {
        const [citiesRes, businessTypesRes] = await Promise.all([
          fetch('/api/kota-kabupaten'),
          fetch('/api/jenis-usaha')
        ]);
        
        if (citiesRes.ok) {
          const data = await citiesRes.json();
          setCities(data.data.map(c => ({ value: c.name, label: c.name })));
        }
        
        if (businessTypesRes.ok) {
          const data = await businessTypesRes.json();
          setBusinessTypes(data.data.map(b => ({ value: b.name, label: b.name })));
        }
      } catch (err) {
        console.error('Error fetching reference data:', err);
      } finally {
        setLoadingCities(false);
        setLoadingBusinessTypes(false);
      }
    };
    
    fetchReferenceData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.password_confirmation) {
      setError('Konfirmasi password tidak sesuai.');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (role === 'umkm') {
        response = await registerUmkm({
          name: formData.name,
          nik: formData.nik,
          phone_number: formData.phone_number,
          password: formData.password,
          password_confirmation: formData.password_confirmation,
          business_name: formData.business_name,
          business_type: formData.business_type,
          business_address: formData.business_address,
          district_city: formData.district_city,
          raw_material_category: formData.raw_material_category,
          monthly_need_estimate: parseInt(formData.monthly_need_estimate) || 0
        });
      } else {
        response = await registerSupplier({
          name: formData.name,
          nik: formData.nik,
          phone_number: formData.phone_number,
          password: formData.password,
          password_confirmation: formData.password_confirmation,
          supplier_name: formData.supplier_name,
          address: formData.address,
          description: formData.description,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        });
      }

      if (response.success) {
        setIsSuccessModalOpen(true);
      }
    } catch (err) {
      // Map validation errors if exist
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0][0];
        setError(firstError);
      } else {
        setError(err.response?.data?.message || 'Registrasi gagal. Cek kembali data Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased text-[#1E293B]">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        {/* LOGO */}
        <div className="flex justify-center items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#16A34A] to-[#22C55E] text-white shadow-lg shadow-green-200">
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-[#0F172A]">
            Sirkel<span className="text-[#16A34A]">Bisnis</span>
          </span>
        </div>
        <h2 className="text-center text-3xl font-black text-[#0F172A] tracking-tight">
          Buat Akun Baru
        </h2>
        <p className="mt-2 text-center text-sm text-[#64748B]">
          Pilih tipe akun Anda dan daftarkan usaha Anda sekarang
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 border border-[#E2E8F0] shadow-xl shadow-slate-100 sm:rounded-3xl sm:px-10">
          
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 animate-fadeIn">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Role Toggle Selector */}
          <div className="flex rounded-2xl bg-[#F1F5F9] p-1.5 mb-6">
            <button
              type="button"
              onClick={() => setRole('umkm')}
              className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                role === 'umkm' ? 'bg-[#16A34A] text-white shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <User className="h-4 w-4" />
              Sebagai UMKM
            </button>
            <button
              type="button"
              onClick={() => setRole('supplier')}
              className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                role === 'supplier' ? 'bg-[#16A34A] text-white shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Sebagai Supplier
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Common Section */}
            <div className="border-b border-[#F1F5F9] pb-4">
              <h3 className="font-extrabold text-xs text-[#64748B] uppercase tracking-wider mb-4">Informasi Pengguna Utama</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                  <input
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs outline-none focus:border-[#16A34A]"
                    placeholder="Nama lengkap"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">NIK (16 Digit)</label>
                  <input
                    name="nik"
                    required
                    maxLength="16"
                    value={formData.nik}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs outline-none focus:border-[#16A34A]"
                    placeholder="Contoh: 3201..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">Nomor HP</label>
                  <input
                    name="phone_number"
                    required
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs outline-none focus:border-[#16A34A]"
                    placeholder="Contoh: 08123456789"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">Password</label>
                  <input
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs outline-none focus:border-[#16A34A]"
                    placeholder="Min. 8 karakter"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">Konfirmasi Password</label>
                  <input
                    name="password_confirmation"
                    type="password"
                    required
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs outline-none focus:border-[#16A34A]"
                    placeholder="Ketik ulang password"
                  />
                </div>
              </div>
            </div>

            {/* Conditional Business Profile Section */}
            {role === 'umkm' ? (
              <div className="space-y-4">
                <h3 className="font-extrabold text-xs text-[#64748B] uppercase tracking-wider mb-2">Informasi Profil Bisnis UMKM</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">Nama Usaha</label>
                    <input
                      name="business_name"
                      required
                      value={formData.business_name}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs outline-none focus:border-[#16A34A]"
                      placeholder="Contoh: Kopi Tiam"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">Jenis Usaha</label>
                    <Select
                      name="business_type"
                      options={businessTypes}
                      isLoading={loadingBusinessTypes}
                      placeholder="Cari / Pilih Jenis Usaha"
                      value={businessTypes.find(opt => opt.value === formData.business_type) || null}
                      onChange={(selectedOption) => {
                        setFormData(prev => ({
                          ...prev,
                          business_type: selectedOption ? selectedOption.value : ''
                        }));
                      }}
                      className="text-xs"
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '0.75rem',
                          borderColor: state.isFocused ? '#16A34A' : '#E2E8F0',
                          boxShadow: 'none',
                          padding: '0.1rem 0.2rem',
                          '&:hover': {
                            borderColor: '#16A34A'
                          }
                        })
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">Kategori Bahan Baku Utama</label>
                    <input
                      name="raw_material_category"
                      required
                      value={formData.raw_material_category}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs outline-none focus:border-[#16A34A]"
                      placeholder="Contoh: Tepung / Kain"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">Kebutuhan Bulanan (kg/pcs)</label>
                    <input
                      name="monthly_need_estimate"
                      type="number"
                      required
                      value={formData.monthly_need_estimate}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs outline-none focus:border-[#16A34A]"
                      placeholder="Contoh: 150"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">Kota / Kabupaten</label>
                    <Select
                      name="district_city"
                      options={cities}
                      isLoading={loadingCities}
                      placeholder="Cari Kota / Kabupaten"
                      value={cities.find(opt => opt.value === formData.district_city) || null}
                      onChange={(selectedOption) => {
                        setFormData(prev => ({
                          ...prev,
                          district_city: selectedOption ? selectedOption.value : ''
                        }));
                      }}
                      className="text-xs"
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '0.75rem',
                          borderColor: state.isFocused ? '#16A34A' : '#E2E8F0',
                          boxShadow: 'none',
                          padding: '0.1rem 0.2rem',
                          '&:hover': {
                            borderColor: '#16A34A'
                          }
                        })
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">Alamat Lengkap Usaha</label>
                    <textarea
                      name="business_address"
                      required
                      rows="2"
                      value={formData.business_address}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs outline-none focus:border-[#16A34A] resize-none"
                      placeholder="Alamat jalan lengkap..."
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-extrabold text-xs text-[#64748B] uppercase tracking-wider mb-2">Informasi Profil Supplier</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">Nama Supplier / Perusahaan</label>
                    <input
                      name="supplier_name"
                      required
                      value={formData.supplier_name}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs outline-none focus:border-[#16A34A]"
                      placeholder="Contoh: CV Tani Makmur"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">Alamat Lengkap Supplier</label>
                    <input
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs outline-none focus:border-[#16A34A]"
                      placeholder="Alamat pergudangan/kantor..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">Deskripsi Supplier</label>
                    <textarea
                      name="description"
                      required
                      rows="2"
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-xs outline-none focus:border-[#16A34A] resize-none"
                      placeholder="Menyediakan bahan pangan berkualitas tinggi..."
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-2xl shadow-lg shadow-green-100 text-sm font-bold text-white bg-gradient-to-r from-[#16A34A] to-[#22C55E] hover:from-[#15803D] hover:to-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] transition-all"
              >
                {loading ? 'Mendaftarkan...' : 'Daftar Akun Sekarang'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-[#F1F5F9] pt-6 text-center">
            <p className="text-xs text-[#64748B] font-semibold">
              Sudah memiliki akun?{' '}
              <Link to="/login" className="text-[#16A34A] hover:underline font-bold">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>

      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-2xl animate-scaleUp text-center space-y-5 mx-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <ShieldCheck className="h-10 w-10 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h3 className="font-black text-xl text-[#0F172A]">Registrasi Berhasil!</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Akun Anda telah berhasil terdaftar. Silakan masuk menggunakan nomor HP/email dan kata sandi yang telah Anda daftarkan.
              </p>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="w-full py-3.5 px-4 rounded-2xl shadow-lg shadow-green-100 text-xs font-bold text-white bg-gradient-to-r from-[#16A34A] to-[#22C55E] hover:from-[#15803D] hover:to-[#16A34A] transition-all hover:scale-[1.01]"
            >
              Masuk Sekarang
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

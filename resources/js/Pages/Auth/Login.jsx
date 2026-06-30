import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, AlertTriangle, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    remember: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await login(formData);
      if (response.success) {
        const role = response.user.role;
        if (role === 'umkm') {
          navigate('/umkm/dashboard');
        } else if (role === 'supplier') {
          navigate('/supplier/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Silakan periksa kembali email/nomor HP dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased text-[#1E293B]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* LOGO */}
        <div className="flex justify-center items-center gap-3 mb-6">
          <img src="/logo.png" alt="SirkelBisnis" className="h-12 w-12 rounded-2xl object-cover object-top bg-white shadow-md" />
          <span className="font-extrabold text-2xl tracking-tight text-[#0F172A]">
            Sirkel<span className="text-[#16A34A]">Bisnis</span>
          </span>
        </div>
        <h2 className="text-center text-3xl font-black text-[#0F172A] tracking-tight">
          Masuk ke Akun Anda
        </h2>
        <p className="mt-2 text-center text-sm text-[#64748B]">
          Pantau rantai pasok lokal dan kelompok patungan
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-[#E2E8F0] shadow-xl shadow-slate-100 sm:rounded-3xl sm:px-10">
          
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 animate-fadeIn">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="login" className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                Email atau Nomor HP
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  id="login"
                  name="login"
                  type="text"
                  required
                  value={formData.login}
                  onChange={handleChange}
                  placeholder="name@company.com atau 0812..."
                  className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] py-3 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-[#16A34A] focus:bg-white focus:ring-1 focus:ring-[#16A34A]/25"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] py-3 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-[#16A34A] focus:bg-white focus:ring-1 focus:ring-[#16A34A]/25"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#16A34A] focus:ring-[#16A34A] border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-xs font-semibold text-[#64748B]">
                  Ingat saya
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-2xl shadow-lg shadow-green-100 text-sm font-bold text-white bg-gradient-to-r from-[#16A34A] to-[#22C55E] hover:from-[#15803D] hover:to-[#16A34A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] transition-all"
              >
                {loading ? 'Memproses...' : 'Masuk ke Aplikasi'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-[#F1F5F9] pt-6 text-center">
            <p className="text-xs text-[#64748B] font-semibold">
              Belum terdaftar?{' '}
              <Link to="/register" className="text-[#16A34A] hover:underline font-bold">
                Buat akun baru di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

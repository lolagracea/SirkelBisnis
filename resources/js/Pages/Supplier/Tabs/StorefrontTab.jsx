import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Store, Clock, Settings, Save } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

export default function StorefrontTab({ setToast }) {
  const { user } = useAuth();
  const supplierId = user?.profile?.id;

  const [formData, setFormData] = useState({
    vacation_mode: false,
    open_time: '08:00',
    close_time: '17:00',
    return_policy: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (supplierId) {
      api.get(`/suppliers/${supplierId}`).then(res => {
        if (res.data.success) {
          const profile = res.data.data;
          setFormData({
            vacation_mode: profile.vacation_mode || false,
            open_time: profile.open_time || '08:00',
            close_time: profile.close_time || '17:00',
            return_policy: profile.return_policy || ''
          });
        }
      });
    }
  }, [supplierId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put(`/suppliers/${supplierId}`, formData);
      if (res.data.success) {
        setToast({ visible: true, type: 'success', message: 'Pengaturan toko berhasil disimpan' });
      }
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Gagal menyimpan pengaturan toko' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Pengaturan Etalase & Operasional</h2>
          <p className="text-sm text-slate-500">Atur jam buka, mode libur, dan kebijakan toko Anda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={formData.vacation_mode}
                onChange={(e) => setFormData({...formData, vacation_mode: e.target.checked})}
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${formData.vacation_mode ? 'bg-orange-500' : 'bg-slate-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.vacation_mode ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Mode Libur (Vacation Mode)</p>
              <p className="text-xs text-slate-500">Aktifkan untuk menyembunyikan toko dari pembeli sementara waktu.</p>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Jam Buka</label>
            <div className="relative">
              <Clock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input 
                type="time" 
                value={formData.open_time}
                onChange={(e) => setFormData({...formData, open_time: e.target.value})}
                className="w-full pl-9 border-slate-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Jam Tutup</label>
            <div className="relative">
              <Clock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input 
                type="time" 
                value={formData.close_time}
                onChange={(e) => setFormData({...formData, close_time: e.target.value})}
                className="w-full pl-9 border-slate-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500" 
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Kebijakan Retur & Toko (Return Policy)</label>
          <textarea 
            rows="4" 
            value={formData.return_policy}
            onChange={(e) => setFormData({...formData, return_policy: e.target.value})}
            className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500"
            placeholder="Jelaskan syarat pengembalian barang jika rusak..."
          ></textarea>
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </form>
    </div>
  );
}

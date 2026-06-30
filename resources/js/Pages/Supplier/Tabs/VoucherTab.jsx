import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit3, Trash2 } from 'lucide-react';
import api from '../../../lib/api';

export default function VoucherTab({ setToast }) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [formData, setFormData] = useState({
    code: '', type: 'percentage', value: '', min_purchase: '', max_discount: '', quota: '', valid_until: ''
  });

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const res = await api.get('/vouchers');
      setVouchers(res.data.data);
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Failed to fetch vouchers' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVoucher) {
        await api.put(`/vouchers/${editingVoucher.id}`, formData);
        setToast({ visible: true, type: 'success', message: 'Voucher updated' });
      } else {
        await api.post('/vouchers', formData);
        setToast({ visible: true, type: 'success', message: 'Voucher created' });
      }
      setIsModalOpen(false);
      fetchVouchers();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to save voucher';
      setToast({ visible: true, type: 'error', message: errorMsg });
    }
  };

  const openAdd = () => {
    setEditingVoucher(null);
    setFormData({ code: '', type: 'percentage', value: '', min_purchase: '', max_discount: '', quota: '', valid_until: '' });
    setIsModalOpen(true);
  };

  const openEdit = (voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      code: voucher.code,
      type: voucher.type,
      value: voucher.value,
      min_purchase: voucher.min_purchase || '',
      max_discount: voucher.max_discount || '',
      quota: voucher.quota,
      valid_until: new Date(voucher.valid_until).toISOString().slice(0, 10)
    });
    setIsModalOpen(true);
  };

  const deleteVoucher = async (id) => {
    if (!confirm('Hapus voucher?')) return;
    try {
      await api.delete(`/vouchers/${id}`);
      setToast({ visible: true, type: 'success', message: 'Voucher deleted' });
      fetchVouchers();
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Failed to delete' });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Marketing Tools (Promo)</h1>
          <p className="text-slate-500 text-sm">Kelola voucher promo untuk menarik UMKM berbelanja.</p>
        </div>
        <button onClick={openAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-700">
          <Plus size={16} /> Buat Voucher
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="text-slate-400 p-6 col-span-3 text-center">Loading...</div>
        ) : vouchers.length === 0 ? (
          <div className="text-slate-400 p-6 col-span-3 text-center bg-white rounded-xl border border-slate-200">Belum ada voucher.</div>
        ) : (
          vouchers.map(v => (
            <div key={v.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4 relative">
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => openEdit(v)} className="text-slate-400 hover:text-emerald-600"><Edit3 size={16}/></button>
                <button onClick={() => deleteVoucher(v.id)} className="text-slate-400 hover:text-rose-600"><Trash2 size={16}/></button>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Tag size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{v.code}</h3>
                  <p className="text-xs text-slate-500 font-medium capitalize">Diskon {v.type}</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-400 block">Nilai</span><span className="font-bold text-slate-700">{v.type === 'percentage' ? `${v.value}%` : `Rp ${v.value}`}</span></div>
                <div><span className="text-slate-400 block">Quota</span><span className="font-bold text-slate-700">{v.used_count} / {v.quota}</span></div>
                <div><span className="text-slate-400 block">Min Belanja</span><span className="font-bold text-slate-700">{v.min_purchase ? `Rp ${v.min_purchase}` : '-'}</span></div>
                <div><span className="text-slate-400 block">Maks Diskon</span><span className="font-bold text-slate-700">{v.max_discount ? `Rp ${v.max_discount}` : '-'}</span></div>
              </div>
              <div className="text-xs text-slate-400 font-medium mt-auto border-t border-slate-100 pt-3 text-center">
                Berlaku s/d {new Date(v.valid_until).toLocaleDateString('id-ID')}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">{editingVoucher ? 'Edit Voucher' : 'Buat Voucher'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Voucher</label>
                <input type="text" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm">
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nilai</label>
                  <input type="number" required value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Belanja (Opsional)</label>
                  <input type="number" value={formData.min_purchase} onChange={e => setFormData({...formData, min_purchase: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Maks Diskon (Opsional)</label>
                  <input type="number" value={formData.max_discount} onChange={e => setFormData({...formData, max_discount: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quota</label>
                  <input type="number" required value={formData.quota} onChange={e => setFormData({...formData, quota: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Berlaku Sampai</label>
                  <input type="date" required value={formData.valid_until} onChange={e => setFormData({...formData, valid_until: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold">Batal</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

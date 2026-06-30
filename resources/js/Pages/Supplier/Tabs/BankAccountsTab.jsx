import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Landmark, Plus, Trash2, Edit3, CheckCircle } from 'lucide-react';

export default function BankAccountsTab({ setToast }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, bank_name: '', account_number: '', account_holder_name: '', is_primary: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/supplier-bank-accounts');
      if (res.data.success) {
        setAccounts(res.data.data);
      }
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Gagal mengambil rekening bank' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let res;
      if (formData.id) {
        res = await axios.put(`/api/supplier-bank-accounts/${formData.id}`, formData);
      } else {
        res = await axios.post('/api/supplier-bank-accounts', formData);
      }
      
      if (res.data.success) {
        setToast({ visible: true, type: 'success', message: 'Rekening bank berhasil disimpan' });
        setIsModalOpen(false);
        fetchAccounts();
      }
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Gagal menyimpan rekening bank' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus rekening ini?')) return;
    try {
      const res = await axios.delete(`/api/supplier-bank-accounts/${id}`);
      if (res.data.success) {
        setToast({ visible: true, type: 'success', message: 'Rekening dihapus' });
        fetchAccounts();
      }
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Gagal menghapus' });
    }
  };

  const openModal = (account = null) => {
    if (account) {
      setFormData(account);
    } else {
      setFormData({ id: null, bank_name: '', account_number: '', account_holder_name: '', is_primary: accounts.length === 0 });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Rekening Bank & Pajak</h2>
            <p className="text-sm text-slate-500">Kelola akun bank untuk penarikan dana B2B</p>
          </div>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah Rekening
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center text-slate-500">Loading...</div>
        ) : accounts.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            Belum ada rekening bank. Tambahkan untuk menerima pembayaran.
          </div>
        ) : (
          accounts.map(acc => (
            <div key={acc.id} className="border border-slate-200 rounded-xl p-5 relative group hover:border-blue-300 transition-colors">
              {acc.is_primary && (
                <span className="absolute top-4 right-4 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Utama
                </span>
              )}
              <h3 className="font-bold text-slate-800 text-lg mb-1">{acc.bank_name}</h3>
              <p className="text-slate-600 font-mono tracking-wider mb-3">{acc.account_number}</p>
              <p className="text-sm text-slate-500 uppercase tracking-wide">{acc.account_holder_name}</p>
              
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(acc)} className="text-slate-500 hover:text-blue-600 p-1">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(acc.id)} className="text-slate-500 hover:text-red-600 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{formData.id ? 'Edit Rekening' : 'Tambah Rekening'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Bank (Misal: BCA, Mandiri)</label>
                <input required type="text" value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})} className="w-full border-slate-300 rounded-lg shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Rekening</label>
                <input required type="text" value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} className="w-full border-slate-300 rounded-lg shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pemilik Rekening</label>
                <input required type="text" value={formData.account_holder_name} onChange={e => setFormData({...formData, account_holder_name: e.target.value})} className="w-full border-slate-300 rounded-lg shadow-sm uppercase" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.is_primary} onChange={e => setFormData({...formData, is_primary: e.target.checked})} className="rounded text-blue-600" />
                <span className="text-sm text-slate-700">Jadikan Rekening Utama</span>
              </label>
              
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">{saving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

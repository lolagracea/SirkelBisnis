import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';
import supplierStaffService from '../../../services/supplierStaffService';

export default function StaffTab({ setToast }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', supplier_role: 'warehouse' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await supplierStaffService.getStaff();
      setStaff(res.data || []);
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Gagal memuat data staf.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await supplierStaffService.addStaff(formData);
      setToast({ visible: true, type: 'success', message: 'Staf berhasil ditambahkan.' });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', supplier_role: 'warehouse' });
      fetchStaff();
    } catch (err) {
      setToast({ visible: true, type: 'error', message: err.response?.data?.message || 'Gagal menambahkan staf.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id) => {
    if(!window.confirm('Yakin ingin menghapus staf ini?')) return;
    try {
      await supplierStaffService.removeStaff(id);
      setToast({ visible: true, type: 'success', message: 'Staf berhasil dihapus.' });
      fetchStaff();
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Gagal menghapus staf.' });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Staf Toko</h1>
          <p className="text-slate-500 text-sm">Kelola akun karyawan yang dapat mengakses portal supplier.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={16} /> Tambah Staf
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading data...</div>
        ) : staff.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Belum ada staf terdaftar.</div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50 text-xs uppercase tracking-wider">
                <th className="py-3.5 px-6">Nama Staf</th>
                <th className="py-3.5 px-6">Email</th>
                <th className="py-3.5 px-6">Role / Peran</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(member => (
                <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50/30">
                  <td className="py-4 px-6 font-bold text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      {member.name.charAt(0)}
                    </div>
                    {member.name}
                  </td>
                  <td className="py-4 px-6 text-slate-600">{member.email}</td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                      {member.supplier_role || 'STAFF'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button 
                      onClick={() => handleRemove(member.id)}
                      className="text-rose-500 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Hapus Staf"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-lg">Tambah Karyawan Baru</h3>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Nama Lengkap</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 w-full p-2 border rounded-lg text-sm outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Email Login</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 w-full p-2 border rounded-lg text-sm outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Password</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="mt-1 w-full p-2 border rounded-lg text-sm outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Hak Akses</label>
                <select value={formData.supplier_role} onChange={e => setFormData({...formData, supplier_role: e.target.value})} className="mt-1 w-full p-2 border rounded-lg text-sm outline-none focus:border-emerald-500">
                  <option value="admin">Admin Toko</option>
                  <option value="warehouse">Staf Gudang/Operasional</option>
                  <option value="finance">Keuangan</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg text-sm">Batal</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg text-sm">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

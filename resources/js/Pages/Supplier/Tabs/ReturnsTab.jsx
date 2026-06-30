import React, { useState, useEffect } from 'react';
import { Package, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import returnService from '../../../services/returnService';

export default function ReturnsTab({ setToast }) {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      const res = await returnService.getReturns();
      setReturns(res.data || []);
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Gagal memuat data return.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status, notes) => {
    try {
      await returnService.updateStatus(id, status, notes);
      setToast({ visible: true, type: 'success', message: `Status berhasil diubah ke ${status}` });
      fetchReturns();
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Gagal memperbarui status return.' });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Return & RMA</h1>
        <p className="text-slate-500 text-sm">Kelola permintaan pengembalian barang dari pihak UMKM.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="text-slate-400 p-6 col-span-2 text-center bg-white rounded-xl border border-slate-200">Loading data...</div>
        ) : returns.length === 0 ? (
          <div className="text-slate-400 p-6 col-span-2 text-center bg-white rounded-xl border border-slate-200">Belum ada permintaan return.</div>
        ) : (
          returns.map(req => (
            <div key={req.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Return Order #{req.order_id}</h3>
                    <p className="text-xs text-slate-500 font-medium">Qty Return: {req.quantity}</p>
                  </div>
                </div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  req.status === 'approved' || req.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  req.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {req.status.toUpperCase()}
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg text-sm border border-slate-100">
                <p className="font-bold text-slate-700 mb-1">Alasan Pengembalian:</p>
                <p className="text-slate-600">{req.reason}</p>
              </div>

              {req.supplier_notes && (
                <div className="bg-emerald-50 p-4 rounded-lg text-sm border border-emerald-100">
                  <p className="font-bold text-emerald-800 mb-1">Catatan Supplier:</p>
                  <p className="text-emerald-700">{req.supplier_notes}</p>
                </div>
              )}

              {req.status === 'pending' && (
                <div className="mt-2 space-y-3">
                  <textarea 
                    id={`note-${req.id}`}
                    placeholder="Tulis alasan jika menolak, atau catatan jika menerima..."
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500"
                    rows="2"
                  ></textarea>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleUpdateStatus(req.id, 'rejected', document.getElementById(`note-${req.id}`).value)}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg py-2 text-sm font-bold shadow-sm transition-all"
                    >
                      Tolak
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(req.id, 'approved', document.getElementById(`note-${req.id}`).value)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 text-sm font-bold shadow-sm transition-all"
                    >
                      Setujui
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

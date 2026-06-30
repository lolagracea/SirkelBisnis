import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import api from '../../../lib/api';

export default function DisputeTab({ setToast }) {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const res = await api.get('/disputes');
      setDisputes(res.data.data);
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Failed to fetch disputes' });
    } finally {
      setLoading(false);
    }
  };

  const respondDispute = async (id, response, status) => {
    try {
      await api.patch(`/disputes/${id}/respond`, { response, status });
      setToast({ visible: true, type: 'success', message: 'Tanggapan terkirim' });
      fetchDisputes();
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Failed to respond to dispute' });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Retur (RMA / Dispute)</h1>
        <p className="text-slate-500 text-sm">Tanggapi keluhan atau retur barang dari UMKM.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="text-slate-400 p-6 col-span-2 text-center">Loading...</div>
        ) : disputes.length === 0 ? (
          <div className="text-slate-400 p-6 col-span-2 text-center bg-white rounded-xl border border-slate-200">Belum ada komplain / dispute.</div>
        ) : (
          disputes.map(dis => (
            <div key={dis.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Order #{dis.order_id}</h3>
                    <p className="text-xs text-slate-500 font-medium">Oleh UMKM: {dis.order?.buyer?.name}</p>
                  </div>
                </div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  dis.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  dis.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {dis.status.toUpperCase()}
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg text-sm border border-slate-100">
                <p className="font-bold text-slate-700 mb-1">Alasan Komplain:</p>
                <p className="text-slate-600">{dis.reason}</p>
                {dis.evidence_url && (
                  <a href={`/storage/${dis.evidence_url}`} target="_blank" rel="noreferrer" className="text-emerald-600 text-xs font-bold mt-2 block hover:underline">
                    Lihat Bukti Foto
                  </a>
                )}
              </div>

              {dis.supplier_response && (
                <div className="bg-emerald-50 p-4 rounded-lg text-sm border border-emerald-100">
                  <p className="font-bold text-emerald-800 mb-1">Tanggapan Anda:</p>
                  <p className="text-emerald-700">{dis.supplier_response}</p>
                </div>
              )}

              {dis.status === 'pending' && (
                <div className="mt-2 space-y-3">
                  <textarea 
                    id={`response-${dis.id}`}
                    placeholder="Tulis tanggapan / solusi (misal: Barang akan diganti, silahkan kirim balik)"
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500"
                    rows="3"
                  ></textarea>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => respondDispute(dis.id, document.getElementById(`response-${dis.id}`).value, 'resolved')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 text-sm font-bold flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} /> Setujui & Selesaikan
                    </button>
                    <button 
                      onClick={() => respondDispute(dis.id, document.getElementById(`response-${dis.id}`).value, 'rejected')}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg py-2 text-sm font-bold flex items-center justify-center gap-2"
                    >
                      <XCircle size={16} /> Tolak Komplain
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

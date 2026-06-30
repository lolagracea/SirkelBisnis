import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Users, Send, CheckCircle, AlertTriangle } from 'lucide-react';

export default function CrmTab({ setToast }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/supplier-crm/customers');
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Gagal mengambil pelanggan' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCustomers(customers.map(c => c.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelect = (id) => {
    if (selectedCustomers.includes(id)) {
      setSelectedCustomers(selectedCustomers.filter(cId => cId !== id));
    } else {
      setSelectedCustomers([...selectedCustomers, id]);
    }
  };

  const handleBroadcast = async () => {
    if (selectedCustomers.length === 0) {
      setToast({ visible: true, type: 'error', message: 'Pilih minimal satu pelanggan' });
      return;
    }
    if (!message.trim()) {
      setToast({ visible: true, type: 'error', message: 'Pesan tidak boleh kosong' });
      return;
    }

    try {
      setBroadcasting(true);
      const res = await api.post('/supplier-crm/broadcast', {
        message,
        customer_ids: selectedCustomers
      });
      if (res.data.success) {
        setToast({ visible: true, type: 'success', message: 'Broadcast berhasil dikirim!' });
        setMessage('');
        setSelectedCustomers([]);
      }
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Gagal mengirim broadcast' });
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Customer Relationship Management (CRM)</h2>
          <p className="text-sm text-slate-500">Kirim pesan promo atau info ke UMKM pelanggan Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <input type="checkbox" checked={selectedCustomers.length === customers.length && customers.length > 0} onChange={handleSelectAll} className="rounded text-indigo-600 focus:ring-indigo-500" />
                  </th>
                  <th className="p-4">Nama UMKM</th>
                  <th className="p-4">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="3" className="p-4 text-center text-slate-500">Loading...</td></tr>
                ) : customers.length === 0 ? (
                  <tr><td colSpan="3" className="p-4 text-center text-slate-500">Belum ada pelanggan</td></tr>
                ) : (
                  customers.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-4 text-center">
                        <input type="checkbox" checked={selectedCustomers.includes(c.id)} onChange={() => handleSelect(c.id)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                      </td>
                      <td className="p-4 font-medium text-slate-700">{c.name}</td>
                      <td className="p-4 text-slate-500">{c.email}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-500" /> Broadcast Pesan
            </h3>
            <p className="text-xs text-slate-500 mb-4">Pesan akan dikirim ke {selectedCustomers.length} UMKM terpilih.</p>
            <textarea
              className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm p-3 mb-4 h-32"
              placeholder="Tulis pesan promo atau info produk baru di sini..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              onClick={handleBroadcast}
              disabled={broadcasting || selectedCustomers.length === 0 || !message.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {broadcasting ? 'Mengirim...' : 'Kirim Broadcast'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

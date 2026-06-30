import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import axios from 'axios';

export default function InvoicesTab({ setToast }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await axios.get('/api/invoices', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setInvoices(res.data.data);
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Failed to fetch invoices' });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`/api/invoices/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setToast({ visible: true, type: 'success', message: `Invoice marked as ${status}` });
      fetchInvoices();
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Failed to update status' });
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price);
  };

  const downloadTaxReport = async () => {
    try {
      const res = await axios.get('/api/analytics/tax-report', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "b2b_tax_report.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      setToast({ visible: true, type: 'success', message: 'Laporan Pajak berhasil diunduh.' });
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Gagal mengunduh laporan pajak.' });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Invoices & Term of Payment</h1>
          <p className="text-slate-500 text-sm">Kelola tagihan pembayaran (Tempo) B2B dengan UMKM.</p>
        </div>
        <button onClick={downloadTaxReport} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm flex items-center gap-2">
          <FileText size={16} /> Laporan Pajak B2B
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50 text-xs uppercase tracking-wider">
                <th className="py-3.5 px-6">ID Invoice</th>
                <th className="py-3.5 px-6">Order Code</th>
                <th className="py-3.5 px-6">Tagihan</th>
                <th className="py-3.5 px-6">Jatuh Tempo</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="py-8 text-center text-slate-400">Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center text-slate-400">Tidak ada data invoice.</td></tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50/30">
                    <td className="py-4 px-6 font-mono font-bold text-slate-600">INV-{inv.id}</td>
                    <td className="py-4 px-6 font-bold text-slate-800">{inv.order?.order_code}</td>
                    <td className="py-4 px-6 font-bold text-slate-800">{formatPrice(inv.amount)}</td>
                    <td className="py-4 px-6 font-medium text-slate-500">{new Date(inv.due_date).toLocaleDateString('id-ID')}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        inv.status === 'overdue' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {inv.status === 'unpaid' && (
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => updateStatus(inv.id, 'paid')} className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold">Paid</button>
                          <button onClick={() => updateStatus(inv.id, 'overdue')} className="px-3 py-1 bg-rose-600 text-white rounded text-xs font-bold">Overdue</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

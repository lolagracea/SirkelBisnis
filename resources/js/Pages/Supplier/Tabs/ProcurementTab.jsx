import React, { useState, useEffect } from 'react';
import { Truck, Factory, Package, ArrowRight, CheckCircle, Plus } from 'lucide-react';
import procurementService from '../../../services/procurementService';

export default function ProcurementTab({ setToast }) {
  const [manufacturers, setManufacturers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // New PO state
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [poForm, setPoForm] = useState({ manufacturer_id: '', items: [{ name: '', quantity: '', unit_price: '' }] });
  const [poSubmitting, setPoSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const mRes = await procurementService.getManufacturers();
      setManufacturers(mRes.data || []);
      const pRes = await procurementService.getPurchaseOrders();
      setPurchaseOrders(pRes.data || []);
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Gagal memuat data procurement.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoItem = () => {
    setPoForm({ ...poForm, items: [...poForm.items, { name: '', quantity: '', unit_price: '' }] });
  };

  const submitPo = async (e) => {
    e.preventDefault();
    setPoSubmitting(true);
    try {
      await procurementService.createPurchaseOrder(poForm);
      setToast({ visible: true, type: 'success', message: 'Purchase Order berhasil dibuat.' });
      setIsPoModalOpen(false);
      setPoForm({ manufacturer_id: '', items: [{ name: '', quantity: '', unit_price: '' }] });
      fetchData();
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Gagal membuat Purchase Order.' });
    } finally {
      setPoSubmitting(false);
    }
  };

  const receivePo = async (id) => {
    if(!window.confirm('Tandai Purchase Order ini sudah diterima dan masuk gudang?')) return;
    try {
      await procurementService.receivePurchaseOrder(id);
      setToast({ visible: true, type: 'success', message: 'Barang diterima, stok ledger terupdate.' });
      fetchData();
    } catch (err) {
      setToast({ visible: true, type: 'error', message: 'Gagal menerima PO.' });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Procurement B2B (Hulu)</h1>
          <p className="text-slate-500 text-sm">Beli stok ke Pabrik (Manufacturer) & terima barang masuk gudang.</p>
        </div>
        <button 
          onClick={() => setIsPoModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={16} /> Buat PO Baru
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Factory size={20} className="text-slate-400" /> Daftar Pabrik Partner
          </h3>
          {loading ? <p className="text-slate-400 text-sm">Loading...</p> : manufacturers.map(m => (
            <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-1">
              <h4 className="font-bold text-slate-800">{m.name}</h4>
              <p className="text-xs text-slate-500">{m.contact_person} - {m.email}</p>
            </div>
          ))}
          {manufacturers.length === 0 && !loading && <p className="text-slate-400 text-sm bg-white p-4 border rounded-xl">Belum ada pabrik.</p>}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Package size={20} className="text-slate-400" /> Riwayat Purchase Order
          </h3>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading data...</div>
            ) : purchaseOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Belum ada history PO ke pabrik.</div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50 text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">PO Number</th>
                    <th className="py-3 px-4">Pabrik</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map(po => (
                    <tr key={po.id} className="border-b border-slate-100">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{po.po_number}</td>
                      <td className="py-3 px-4 text-slate-700">{po.manufacturer?.name}</td>
                      <td className="py-3 px-4 text-slate-800 font-bold">Rp {parseInt(po.total_amount).toLocaleString('id-ID')}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          po.status === 'received' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {po.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {po.status === 'pending' && (
                          <button 
                            onClick={() => receivePo(po.id)}
                            className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
                          >
                            Terima Barang
                          </button>
                        )}
                        {po.status === 'received' && (
                          <span className="text-emerald-500"><CheckCircle size={18} className="inline" /></span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {isPoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-900 text-lg">Buat Purchase Order (PO) Baru</h3>
            </div>
            <form onSubmit={submitPo} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Pilih Pabrik (Manufacturer)</label>
                <select required value={poForm.manufacturer_id} onChange={e => setPoForm({...poForm, manufacturer_id: e.target.value})} className="mt-1 w-full p-2 border rounded-lg text-sm outline-none focus:border-indigo-500">
                  <option value="">-- Pilih Pabrik --</option>
                  {manufacturers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-600 uppercase">Daftar Barang (Item)</label>
                  <button type="button" onClick={handleAddPoItem} className="text-xs font-bold text-indigo-600">Tambah Baris</button>
                </div>
                {poForm.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input required type="text" placeholder="Nama Bahan / Produk" value={item.name} onChange={e => {
                      const newItems = [...poForm.items]; newItems[idx].name = e.target.value; setPoForm({...poForm, items: newItems});
                    }} className="flex-1 p-2 border rounded-lg text-sm outline-none focus:border-indigo-500" />
                    <input required type="number" placeholder="Qty" value={item.quantity} onChange={e => {
                      const newItems = [...poForm.items]; newItems[idx].quantity = e.target.value; setPoForm({...poForm, items: newItems});
                    }} className="w-20 p-2 border rounded-lg text-sm outline-none focus:border-indigo-500" />
                    <input required type="number" placeholder="Harga/Unit" value={item.unit_price} onChange={e => {
                      const newItems = [...poForm.items]; newItems[idx].unit_price = e.target.value; setPoForm({...poForm, items: newItems});
                    }} className="w-28 p-2 border rounded-lg text-sm outline-none focus:border-indigo-500" />
                  </div>
                ))}
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsPoModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg text-sm">Batal</button>
                <button type="submit" disabled={poSubmitting} className="flex-1 px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg text-sm">Buat PO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

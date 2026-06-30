import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Package, Printer } from 'lucide-react';
import orderService from '../../services/orderService';

export default function PrintInvoice() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await orderService.getOrder(id);
        if (response.success) {
          setOrder(response.data);
        } else {
          setOrder(response); // Fallback if API returns direct object
        }
      } catch (err) {
        setError('Gagal memuat invoice.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-10 text-center font-bold">Memuat dokumen...</div>;
  if (error || !order) return <div className="p-10 text-center text-red-600">{error}</div>;

  const formatPrice = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  return (
    <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white flex flex-col items-center font-sans">
      <div className="w-full max-w-4xl mb-4 print:hidden flex justify-end">
        <button 
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm"
        >
          <Printer size={18} /> Cetak Dokumen
        </button>
      </div>

      <div className="w-full max-w-4xl bg-white p-12 shadow-lg rounded-2xl print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-200 pb-8 mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">INVOICE</h1>
            <p className="text-slate-500 font-medium mt-1">Nomor Pesanan: <span className="text-slate-800 font-bold">ORD-{String(order.id).padStart(5, '0')}</span></p>
            <p className="text-slate-500 font-medium">Tanggal: <span className="text-slate-800 font-bold">{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-emerald-600 flex items-center justify-end gap-2">
              <Package size={24} /> SirkelBisnis
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">B2B E-Commerce & Supply Chain</p>
          </div>
        </div>

        {/* Addresses */}
        <div className="flex justify-between mb-10 bg-slate-50 p-6 rounded-xl border border-slate-100 print:bg-transparent print:border-none print:p-0">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">DITERBITKAN OLEH (SUPPLIER)</p>
            <p className="font-bold text-slate-800 text-lg">{order.product?.supplier?.supplier_name || 'Supplier Kami'}</p>
            <p className="text-slate-600 text-sm mt-1 max-w-xs">{order.product?.supplier?.address || 'Alamat supplier tidak tercatat.'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">DITAGIHKAN KEPADA (UMKM)</p>
            <p className="font-bold text-slate-800 text-lg">{order.buyer?.name || 'Pelanggan UMKM'}</p>
            <p className="text-slate-600 text-sm mt-1">{order.buyer?.email || '-'}</p>
            <p className="text-slate-600 text-sm font-semibold mt-1">Status: <span className="uppercase text-blue-600">{order.status}</span></p>
          </div>
        </div>

        {/* Order Items Table */}
        <table className="w-full text-left border-collapse mb-8">
          <thead>
            <tr className="border-b-2 border-slate-800 text-slate-800">
              <th className="py-3 font-bold uppercase text-xs tracking-wider">Deskripsi Produk</th>
              <th className="py-3 font-bold uppercase text-xs tracking-wider text-center">Kuantitas</th>
              <th className="py-3 font-bold uppercase text-xs tracking-wider text-right">Harga Satuan</th>
              <th className="py-3 font-bold uppercase text-xs tracking-wider text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="py-4">
                <p className="font-bold text-slate-800 text-base">{order.product?.name || 'Produk'}</p>
                <p className="text-sm text-slate-500">{order.product?.category}</p>
              </td>
              <td className="py-4 text-center font-semibold text-slate-700">{order.quantity} {order.product?.unit || 'unit'}</td>
              <td className="py-4 text-right text-slate-700 font-medium">{formatPrice(order.total_price / order.quantity)}</td>
              <td className="py-4 text-right font-bold text-slate-900">{formatPrice(order.total_price)}</td>
            </tr>
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-end mb-12">
          <div className="w-72 space-y-3">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Subtotal</span>
              <span>{formatPrice(order.total_price)}</span>
            </div>
            <div className="flex justify-between text-slate-600 font-medium pb-3 border-b border-slate-200">
              <span>Pajak (0%)</span>
              <span>Rp 0</span>
            </div>
            <div className="flex justify-between text-xl font-black text-slate-900 pt-1">
              <span>TOTAL</span>
              <span className="text-emerald-600">{formatPrice(order.total_price)}</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t-2 border-slate-200 pt-6 flex justify-between items-center text-sm">
          <div>
            {order.shipping_courier && order.tracking_number && (
              <p className="text-slate-600 font-medium">
                Dikirim via <strong className="text-slate-800">{order.shipping_courier}</strong> (Resi: <strong className="text-slate-800">{order.tracking_number}</strong>)
              </p>
            )}
            <p className="text-slate-400 mt-1">Terima kasih telah berbisnis dengan kami.</p>
          </div>
          <div className="text-right text-slate-400">
            <p>Dicetak secara otomatis oleh sistem</p>
            <p className="font-bold text-slate-300">SirkelBisnis B2B Portal</p>
          </div>
        </div>
      </div>
    </div>
  );
}

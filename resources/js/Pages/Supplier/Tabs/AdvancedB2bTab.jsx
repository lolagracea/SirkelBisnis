import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { 
  Building, CreditCard, FileText, Repeat, Link, Megaphone, Loader2 
} from 'lucide-react';

export default function AdvancedB2bTab() {
  const [activeSubTab, setActiveSubTab] = useState('logistics');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTabContent = async (endpoint) => {
    setLoading(true);
    try {
      // Remove '/api' prefix since base URL is already '.../api'
      const cleanEndpoint = endpoint.replace(/^\/api/, '');
      const res = await api.get(cleanEndpoint);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'logistics') fetchTabContent('/api/warehouses');
    else if (activeSubTab === 'credit') fetchTabContent('/api/credit-limits');
    else if (activeSubTab === 'rfq') fetchTabContent('/api/rfqs/supplier');
    else if (activeSubTab === 'subscription') fetchTabContent('/api/subscriptions/supplier');
    else if (activeSubTab === 'webhooks') fetchTabContent('/api/webhook-endpoints');
    else if (activeSubTab === 'ads') fetchTabContent('/api/sponsored-products');
  }, [activeSubTab]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Fitur Advanced B2B</h2>
      </div>
      
      <div className="flex overflow-x-auto space-x-2 border-b border-gray-200 pb-2">
        <button onClick={() => setActiveSubTab('logistics')} className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${activeSubTab === 'logistics' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}`}>
          <Building className="w-4 h-4" /> Logistik & Gudang
        </button>
        <button onClick={() => setActiveSubTab('credit')} className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${activeSubTab === 'credit' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}`}>
          <CreditCard className="w-4 h-4" /> Credit Limit
        </button>
        <button onClick={() => setActiveSubTab('rfq')} className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${activeSubTab === 'rfq' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}`}>
          <FileText className="w-4 h-4" /> RFQ / Quotation
        </button>
        <button onClick={() => setActiveSubTab('subscription')} className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${activeSubTab === 'subscription' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}`}>
          <Repeat className="w-4 h-4" /> Langganan
        </button>
        <button onClick={() => setActiveSubTab('webhooks')} className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${activeSubTab === 'webhooks' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}`}>
          <Link className="w-4 h-4" /> API & Webhooks
        </button>
        <button onClick={() => setActiveSubTab('ads')} className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${activeSubTab === 'ads' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}`}>
          <Megaphone className="w-4 h-4" /> Promosi / Ads
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : (
          <pre className="text-sm text-gray-700 whitespace-pre-wrap">
            {data && data.length > 0 ? JSON.stringify(data, null, 2) : 'Belum ada data untuk fitur ini.'}
          </pre>
        )}
      </div>
    </div>
  );
}

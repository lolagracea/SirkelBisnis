import api from '../lib/api';

const paymentService = {
  /**
   * Inisiasi pembayaran untuk invoice tertentu.
   * @param {number} invoiceId
   * @param {'QRIS'|'VA'} paymentMethod
   * @param {string|null} bankCode - Wajib jika VA (BCA, MANDIRI, BNI, dll)
   */
  checkout: async (invoiceId, paymentMethod, bankCode = null) => {
    const payload = { payment_method: paymentMethod };
    if (paymentMethod === 'VA' && bankCode) {
      payload.bank_code = bankCode;
    }
    const response = await api.post(`/invoices/${invoiceId}/checkout`, payload);
    return response.data;
  },

  /**
   * Cek status transaksi terbaru untuk invoice  // Dapatkan detail tagihan / polling status transaksi (pending, paid, failed)
   */
  getPaymentStatus: async (invoiceId) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}/payment-status`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Simulasikan pembayaran (hanya aktif ketika Sandbox Mock)
  simulatePayment: async (invoiceId) => {
    try {
      const response = await api.post(`/invoices/${invoiceId}/simulate-payment`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Bank yang didukung untuk Virtual Account
  supportedBanks: () => [
    { code: 'BCA',     name: 'BCA' },
    { code: 'MANDIRI', name: 'Bank Mandiri' },
    { code: 'BNI',     name: 'BNI' },
    { code: 'BRI',     name: 'BRI' },
    { code: 'PERMATA', name: 'Bank Permata' },
    { code: 'BSI',     name: 'BSI (Syariah Indonesia)' },
  ],
};

export default paymentService;

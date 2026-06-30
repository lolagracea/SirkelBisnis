import React, { useState, useEffect, useCallback } from 'react';
import { X, QrCode, CreditCard, CheckCircle2, Clock, AlertCircle, Copy, RefreshCw } from 'lucide-react';
import paymentService from '../../services/paymentService';
import useReverb from '../../hooks/useReverb';

// ─────────────────────────────────────────────────────────────────────────────
// QrisDisplay — Render QR code string sebagai image dari Xendit
// ─────────────────────────────────────────────────────────────────────────────
function QrisDisplay({ qrString, amount, expiredAt, onPaid }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiredAt) return;
    const expiry = new Date(expiredAt);

    const tick = () => {
      const now = new Date();
      const diff = expiry - now;
      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Kedaluwarsa');
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiredAt]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-1">Scan QR code ini dengan aplikasi mobile banking atau e-wallet Anda</p>
        <p className="text-2xl font-bold text-green-700">
          Rp {Number(amount).toLocaleString('id-ID')}
        </p>
      </div>

      {/* QR Code Image — Xendit mengirim qr_string berupa data URL atau URL gambar */}
      <div className={`p-3 rounded-2xl border-4 ${isExpired ? 'border-red-300 opacity-50' : 'border-green-500'} bg-white shadow-lg`}>
        {qrString && qrString.startsWith('data:image') ? (
          <img src={qrString} alt="QRIS Code" className="w-52 h-52 object-contain" />
        ) : (
          /* Fallback: tampilkan sebagai teks qr_string dengan library QR code */
          <div className="w-52 h-52 flex items-center justify-center bg-gray-50 rounded-xl">
            <QrCode size={80} className="text-green-600" />
            <p className="text-xs text-gray-400 mt-2 text-center px-2 break-all hidden">
              {qrString}
            </p>
          </div>
        )}
      </div>

      {/* Timer */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
        isExpired ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
      }`}>
        <Clock size={14} />
        {isExpired ? 'QR sudah kedaluwarsa' : `Berlaku: ${timeLeft}`}
      </div>

      <div className="text-xs text-gray-400 text-center">
        Mendukung: GoPay, OVO, Dana, ShopeePay, dan semua bank dengan fitur QRIS
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VaDisplay — Tampilkan nomor Virtual Account
// ─────────────────────────────────────────────────────────────────────────────
function VaDisplay({ vaNumber, bankCode, amount, expiredAt }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(vaNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bankColors = {
    BCA: 'bg-blue-600',
    MANDIRI: 'bg-yellow-500',
    BNI: 'bg-orange-500',
    BRI: 'bg-blue-800',
    PERMATA: 'bg-red-600',
    BSI: 'bg-teal-600',
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-1">Transfer ke Virtual Account berikut</p>
        <p className="text-2xl font-bold text-green-700">
          Rp {Number(amount).toLocaleString('id-ID')}
        </p>
      </div>

      {/* Bank Badge */}
      <div className={`px-6 py-2 rounded-full text-white font-bold text-lg ${bankColors[bankCode] ?? 'bg-gray-700'}`}>
        {bankCode}
      </div>

      {/* VA Number */}
      <div className="w-full bg-gray-50 border-2 border-dashed border-green-300 rounded-xl p-4 text-center">
        <p className="text-xs text-gray-400 mb-1">Nomor Virtual Account</p>
        <p className="text-2xl font-mono font-bold tracking-widest text-gray-800">{vaNumber}</p>
        <button
          onClick={handleCopy}
          className={`mt-3 flex items-center gap-2 mx-auto px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            copied
              ? 'bg-green-100 text-green-700'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Copy size={14} />
          {copied ? 'Tersalin!' : 'Salin Nomor VA'}
        </button>
      </div>

      {expiredAt && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <Clock size={14} />
          Berlaku hingga: {new Date(expiredAt).toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </div>
      )}

      <div className="text-xs text-gray-400 text-center">
        Pastikan nominal transfer tepat sesuai. Transfer melebihi atau kurang akan ditolak.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CheckoutModal — Modal utama checkout QRIS/VA dengan real-time status
// ─────────────────────────────────────────────────────────────────────────────
function CheckoutModal({ invoice, user, onClose, onPaymentSuccess }) {
  const [step, setStep] = useState('select'); // 'select' | 'processing' | 'waiting' | 'paid' | 'error'
  const [selectedMethod, setSelectedMethod] = useState('QRIS');
  const [selectedBank, setSelectedBank] = useState('BCA');
  const [transactionData, setTransactionData] = useState(null);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);

  const banks = paymentService.supportedBanks();

  // ── Real-time listener via Reverb ─────────────────────────────────────────
  // Subscribe ke channel private UMKM → terima notifikasi 'payment.paid'
  const handlePaymentPaidEvent = useCallback((data) => {
    // Pastikan event ini untuk invoice yang sedang dibuka
    if (data.invoice?.id !== invoice.id) return;

    setStep('paid');
    if (onPaymentSuccess) {
      onPaymentSuccess(data);
    }
  }, [invoice.id, onPaymentSuccess]);

  const handleSimulatePayment = async () => {
    try {
      await paymentService.simulatePayment(invoice.id);
      // We don't change step here, wait for WebSockets or polling to pick it up!
    } catch (err) {
      console.error('Simulasi gagal:', err);
    }
  };

  // Hook WebSocket — hanya aktif saat di step 'waiting'
  useReverb(
    user ? `umkm.${user.id}` : null,
    '.payment.paid',
    handlePaymentPaidEvent,
    step === 'waiting'
  );

  // ── Polling Fallback (setiap 8 detik) ────────────────────────────────────
  useEffect(() => {
    if (step !== 'waiting' || polling) return;

    const interval = setInterval(async () => {
      try {
        const res = await paymentService.getPaymentStatus(invoice.id);
        if (res.data?.status === 'paid') {
          setStep('paid');
          clearInterval(interval);
          if (onPaymentSuccess) {
            onPaymentSuccess({ invoice: { id: invoice.id, status: 'paid' } });
          }
        }
      } catch {
        // Ignore polling errors silently
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [step, polling, invoice.id, onPaymentSuccess]);

  // ── Initiate Checkout ─────────────────────────────────────────────────────
  const handleCheckout = async () => {
    setStep('processing');
    setError('');

    try {
      const result = await paymentService.checkout(
        invoice.id,
        selectedMethod,
        selectedMethod === 'VA' ? selectedBank : null
      );

      if (result.success) {
        setTransactionData(result.data);
        setStep('waiting');
      } else {
        throw new Error(result.message || 'Gagal membuat pembayaran');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Terjadi kesalahan. Coba lagi.';
      setError(msg);
      setStep('error');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={step !== 'processing' ? onClose : undefined}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold">Pembayaran Invoice</h2>
              <p className="text-green-100 text-sm mt-0.5">
                #{invoice.id} · Rp {Number(invoice.amount).toLocaleString('id-ID')}
              </p>
            </div>
            {step !== 'processing' && (
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">

          {/* STEP: Select Method */}
          {step === 'select' && (
            <div className="space-y-5">
              <p className="text-sm font-medium text-gray-600">Pilih metode pembayaran</p>

              {/* Method Selector */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'QRIS', icon: QrCode, label: 'QRIS', sub: 'Scan QR Code' },
                  { id: 'VA',   icon: CreditCard, label: 'Virtual Account', sub: 'Transfer Bank' },
                ].map(({ id, icon: Icon, label, sub }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedMethod(id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      selectedMethod === id
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={28} className={selectedMethod === id ? 'text-green-600' : 'text-gray-400'} />
                    <div className="text-center">
                      <p className={`text-sm font-bold ${selectedMethod === id ? 'text-green-700' : 'text-gray-700'}`}>
                        {label}
                      </p>
                      <p className="text-xs text-gray-400">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Bank Selector (muncul jika VA) */}
              {selectedMethod === 'VA' && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Pilih Bank</p>
                  <div className="grid grid-cols-3 gap-2">
                    {banks.map(({ code, name }) => (
                      <button
                        key={code}
                        onClick={() => setSelectedBank(code)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all ${
                          selectedBank === code
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fee Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                <strong>Info biaya:</strong>{' '}
                {selectedMethod === 'QRIS'
                  ? 'QRIS: 0.7% (maks Rp 1.500)'
                  : 'VA: Rp 4.000 flat per transaksi'}
                {' — dipotong dari pembayaran Anda.'}
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-base hover:from-green-700 hover:to-emerald-600 transition-all shadow-lg active:scale-95"
              >
                Lanjutkan Pembayaran →
              </button>
            </div>
          )}

          {/* STEP: Processing (loading spinner) */}
          {step === 'processing' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-14 h-14 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600 font-medium">Menghubungi Xendit...</p>
              <p className="text-xs text-gray-400">Mohon tunggu, jangan tutup halaman ini</p>
            </div>
          )}

          {/* STEP: Waiting (QR atau VA display) */}
          {step === 'waiting' && transactionData && (
            <div className="space-y-4">
              {selectedMethod === 'QRIS' ? (
                <QrisDisplay
                  qrString={transactionData.qr_string}
                  amount={transactionData.amount}
                  expiredAt={transactionData.expired_at}
                />
              ) : (
                <VaDisplay
                  vaNumber={transactionData.va_number}
                  bankCode={transactionData.bank_code}
                  amount={transactionData.amount}
                  expiredAt={transactionData.expired_at}
                />
              )}

              <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-3 text-xs text-blue-700">
                <RefreshCw size={12} className="animate-spin" />
                Menunggu konfirmasi pembayaran secara otomatis...
              </div>

              {transactionData.is_mock && (
                <button
                  onClick={handleSimulatePayment}
                  className="w-full py-3 rounded-2xl border-2 border-green-500 text-green-600 font-bold hover:bg-green-50 transition-colors shadow-sm"
                >
                  Simulasikan Pembayaran Berhasil
                </button>
              )}
            </div>
          )}

          {/* STEP: Paid (success) */}
          {step === 'paid' && (
            <div className="flex flex-col items-center gap-5 py-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={48} className="text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800">Pembayaran Berhasil!</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Invoice #{invoice.id} telah lunas
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors"
              >
                Selesai
              </button>
            </div>
          )}

          {/* STEP: Error */}
          {step === 'error' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle size={36} className="text-red-500" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-800">Pembayaran Gagal</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setStep('select')}
                  className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
                >
                  Coba Lagi
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl border-2 border-red-200 text-red-600 font-medium hover:bg-red-50"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckoutModal;

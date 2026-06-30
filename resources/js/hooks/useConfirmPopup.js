import { useState, useCallback } from 'react';

/**
 * useConfirmPopup
 *
 * A centralized hook for all critical UMKM confirmation popups.
 * Returns:
 *   - modalProps: spread this onto <ConfirmModal {...modalProps} />
 *   - All 13 confirm functions that return Promise<boolean>
 *
 * Usage example:
 *   const { modalProps, confirmWithdrawal } = useConfirmPopup();
 *   // In your JSX: <ConfirmModal {...modalProps} />
 *   // In your handler:
 *   const ok = await confirmWithdrawal(5000000, 'BCA', 'Budi', '1234');
 *   if (ok) { ... }
 */
export default function useConfirmPopup() {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    confirmText: 'Konfirmasi',
    cancelText: 'Batal',
    confirmColor: 'blue',
    highlightCancel: false,
    resolve: null,
  });

  /** Internal: opens the modal and returns a promise */
  const openModal = useCallback((config) => {
    return new Promise((resolve) => {
      setModalState({ ...config, isOpen: true, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setModalState((prev) => {
      prev.resolve?.(true);
      return { ...prev, isOpen: false };
    });
  }, []);

  const handleCancel = useCallback(() => {
    setModalState((prev) => {
      prev.resolve?.(false);
      return { ...prev, isOpen: false };
    });
  }, []);

  /** Props to spread on <ConfirmModal /> */
  const modalProps = {
    isOpen: modalState.isOpen,
    type: modalState.type,
    title: modalState.title,
    message: modalState.message,
    confirmText: modalState.confirmText,
    cancelText: modalState.cancelText,
    confirmColor: modalState.confirmColor,
    highlightCancel: modalState.highlightCancel,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  };

  // ─── 1. KEUANGAN & PENDANAAN ──────────────────────────────────────────────

  /** Popup: Tarik Saldo ke Rekening Bank */
  const confirmWithdrawal = (amount, bankName, accountName, accountNumber) =>
    openModal({
      type: 'confirm',
      title: 'Tarik Saldo Sekarang?',
      message: `Anda akan menarik dana sebesar <strong>Rp ${Number(amount).toLocaleString('id-ID')}</strong> ke rekening <strong>${bankName} (${accountNumber}) a.n. ${accountName}</strong>. Proses ini akan memotong saldo aplikasi Anda dan tidak dapat dibatalkan. Dana biasanya masuk dalam waktu 1×24 jam kerja.`,
      confirmText: 'Tarik Dana',
      cancelText: 'Cek Kembali',
      confirmColor: 'green',
      highlightCancel: false,
    });

  /** Popup: Pengajuan Pinjaman Modal */
  const confirmLoanApplication = (amount, tenorMonths) =>
    openModal({
      type: 'confirm',
      title: 'Ajukan Modal Usaha?',
      message: `Anda akan mengajukan pinjaman sebesar <strong>Rp ${Number(amount).toLocaleString('id-ID')}</strong> dengan masa cicilan ${tenorMonths} bulan. Dengan melanjutkan, Anda setuju untuk meneruskan data toko ke mitra finansial kami. Lanjutkan pengajuan?`,
      confirmText: 'Ya, Ajukan Sekarang',
      cancelText: 'Nanti Dulu',
      confirmColor: 'blue',
      highlightCancel: false,
    });

  /** Popup: Bayar Cicilan Pinjaman */
  const confirmLoanRepayment = (amount) =>
    openModal({
      type: 'confirm',
      title: 'Bayar Tagihan Bulan Ini?',
      message: `Saldo aplikasi Anda akan otomatis dipotong sebesar <strong>Rp ${Number(amount).toLocaleString('id-ID')}</strong> untuk melunasi cicilan bulan ini. Pastikan sisa saldo Anda cukup untuk operasional harian ya!`,
      confirmText: 'Bayar Tagihan',
      cancelText: 'Batal',
      confirmColor: 'green',
      highlightCancel: false,
    });

  // ─── 2. TRANSAKSI & PEMBELIAN ─────────────────────────────────────────────

  /** Popup: Pembelian Bahan Baku Grosir (B2B) */
  const confirmB2BPurchase = (itemName, quantity, totalAmount) =>
    openModal({
      type: 'confirm',
      title: 'Konfirmasi Pembelian Bahan Baku',
      message: `Anda akan memesan <strong>${quantity} ${itemName}</strong> dengan total tagihan <strong>Rp ${Number(totalAmount).toLocaleString('id-ID')}</strong>. Pesanan tidak bisa dibatalkan sepihak setelah disetujui. Apakah alamat pengiriman sudah benar?`,
      confirmText: 'Ya, Buat Pesanan',
      cancelText: 'Periksa Lagi',
      confirmColor: 'blue',
      highlightCancel: false,
    });

  /** Popup: Kembalikan Dana ke Pelanggan (Refund) */
  const confirmRefund = (amount) =>
    openModal({
      type: 'warning',
      title: 'Kembalikan Dana Pelanggan?',
      message: `Anda akan mengembalikan dana sebesar <strong>Rp ${Number(amount).toLocaleString('id-ID')}</strong> kepada pembeli. Saldo toko Anda akan dipotong dan pesanan dianggap selesai/batal. Tindakan ini bersifat final.`,
      confirmText: 'Kembalikan Dana',
      cancelText: 'Batal',
      confirmColor: 'red',
      highlightCancel: false,
    });

  // ─── 3. MANAJEMEN TOKO & PRODUK ───────────────────────────────────────────

  /** Popup: Hapus Produk dari Katalog */
  const confirmDeleteProduct = (productName) =>
    openModal({
      type: 'delete',
      title: 'Hapus Produk Ini Selamanya?',
      message: `Anda yakin ingin menghapus <strong>"${productName}"</strong>? Produk yang dihapus tidak bisa dilihat pembeli lagi, dan semua riwayat penjualan serta ulasan akan hilang. <br/><span class="text-emerald-600 font-medium">Alternatif aman:</span> ubah stok menjadi 0 (Habis).`,
      confirmText: 'Tetap Hapus',
      cancelText: 'Jangan Hapus',
      confirmColor: 'red',
      highlightCancel: true, // Beri penekanan pada tombol batal
    });

  /** Popup: Aktifkan Mode Libur / Tutup Toko */
  const confirmHolidayMode = () =>
    openModal({
      type: 'warning',
      title: 'Tutup Toko Sementara?',
      message: `Selama mode ini aktif, pembeli tidak bisa membuat pesanan baru. Namun, <strong>pesanan yang sudah masuk tetap harus Anda proses</strong>. Anda bisa membuka kembali toko kapan saja.`,
      confirmText: 'Ya, Tutup Toko',
      cancelText: 'Batal',
      confirmColor: 'orange',
      highlightCancel: false,
    });

  /** Popup: Update Harga Massal */
  const confirmBulkPriceUpdate = (productCount) =>
    openModal({
      type: 'confirm',
      title: 'Terapkan Harga Baru?',
      message: `Anda akan mengubah harga pada <strong>${productCount} produk</strong> sekaligus. Harga baru langsung berlaku untuk semua pembeli di etalase. Pastikan tidak ada salah ketik angka nol (typo).`,
      confirmText: 'Terapkan Harga',
      cancelText: 'Cek Ulang',
      confirmColor: 'blue',
      highlightCancel: false,
    });

  // ─── 4. KEMITRAAN & PATUNGAN ──────────────────────────────────────────────

  /** Popup: Ikut Patungan Grosir (Group Buying) */
  const confirmGroupBuying = (itemName, holdAmount, daysLimit) =>
    openModal({
      type: 'confirm',
      title: 'Ikut Program Patungan?',
      message: `Saldo Anda akan dikunci sementara sebesar <strong>Rp ${Number(holdAmount).toLocaleString('id-ID')}</strong> untuk patungan <strong>"${itemName}"</strong>. Jika kuota tidak terpenuhi dalam ${daysLimit}×24 jam, dana Anda dikembalikan utuh 100%.`,
      confirmText: 'Ikut Patungan',
      cancelText: 'Batal',
      confirmColor: 'blue',
      highlightCancel: false,
    });

  /** Popup: Cairkan Dana Hasil Patungan */
  const confirmJointVentureDisbursement = (profitAmount, partnerCount) =>
    openModal({
      type: 'confirm',
      title: 'Cairkan Dana Patungan?',
      message: `Anda akan mendistribusikan total keuntungan <strong>Rp ${Number(profitAmount).toLocaleString('id-ID')}</strong> kepada <strong>${partnerCount} mitra bisnis</strong> sesuai bagi hasil. Proses ini tidak dapat dibatalkan oleh sistem.`,
      confirmText: 'Cairkan Dana',
      cancelText: 'Batal',
      confirmColor: 'green',
      highlightCancel: false,
    });

  /** Popup: Putus Kemitraan Supplier */
  const confirmCancelSupplierContract = (supplierName) =>
    openModal({
      type: 'warning',
      title: 'Akhiri Kemitraan?',
      message: `Mengakhiri kemitraan dengan <strong>"${supplierName}"</strong> akan mencabut hak Anda dari harga grosir khusus dan promo eksklusif mitra. Anda harus mengajukan kontrak ulang jika ingin berlangganan kembali.`,
      confirmText: 'Akhiri Kemitraan',
      cancelText: 'Pikir-Pikir Dulu',
      confirmColor: 'red',
      highlightCancel: true,
    });

  // ─── 5. LOGISTIK & PENGIRIMAN ─────────────────────────────────────────────

  /** Popup: Batalkan Pesanan oleh Penjual */
  const confirmCancelOrder = (invoiceNumber) =>
    openModal({
      type: 'warning',
      title: 'Batalkan Pesanan Ini?',
      message: `Anda akan membatalkan pesanan <strong>#${invoiceNumber}</strong>. Sering membatalkan pesanan dapat menurunkan skor performa toko Anda dan membuat pembeli beralih ke toko lain. Yakin membatalkan?`,
      confirmText: 'Ya, Batalkan',
      cancelText: 'Jangan Batalkan',
      confirmColor: 'red',
      highlightCancel: true,
    });

  /** Popup: Konfirmasi Barang Dikirim / Input Resi */
  const confirmDispatch = (invoiceNumber, awbNumber) =>
    openModal({
      type: 'confirm',
      title: 'Konfirmasi Barang Dikirim?',
      message: `Status pesanan <strong>#${invoiceNumber}</strong> akan diubah menjadi "Sedang Dikirim" dengan resi <strong>${awbNumber}</strong>. Pastikan paket fisik dan nomor resi sudah benar agar dana pesanan cepat cair!`,
      confirmText: 'Konfirmasi Pengiriman',
      cancelText: 'Cek Resi Lagi',
      confirmColor: 'green',
      highlightCancel: false,
    });

  /** Popup: Selesaikan Pesanan / Konfirmasi Barang Diterima */
  const confirmOrderReceipt = (orderCode) =>
    openModal({
      type: 'confirm',
      title: 'Konfirmasi Barang Diterima?',
      message: `Apakah Anda yakin ingin menyelesaikan pesanan <strong>${orderCode}</strong>? Aksi ini akan menyelesaikan transaksi dan langsung meneruskan dana pembayaran ke saldo dompet supplier.`,
      confirmText: 'Ya, Selesai',
      cancelText: 'Batal',
      confirmColor: 'green',
      highlightCancel: false,
    });

  return {
    modalProps,
    // Keuangan
    confirmWithdrawal,
    confirmLoanApplication,
    confirmLoanRepayment,
    // Transaksi
    confirmB2BPurchase,
    confirmRefund,
    // Toko & Produk
    confirmDeleteProduct,
    confirmHolidayMode,
    confirmBulkPriceUpdate,
    // Kemitraan
    confirmGroupBuying,
    confirmJointVentureDisbursement,
    confirmCancelSupplierContract,
    // Logistik
    confirmCancelOrder,
    confirmDispatch,
    confirmOrderReceipt,
  };
}

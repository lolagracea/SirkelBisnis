<?php

namespace App\Services\Payment;

use App\Models\SupplierProfile;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * WalletService — Menangani kredit saldo supplier secara atomic.
 *
 * Menggunakan `lockForUpdate()` untuk mencegah race condition
 * ketika banyak webhook datang bersamaan.
 */
class WalletService
{
    /**
     * Kredit saldo supplier setelah pembayaran berhasil dikonfirmasi.
     *
     * Dijalankan di dalam DB::transaction() dari WebhookController.
     *
     * @param  int     $supplierId   ID dari supplier_profiles
     * @param  float   $grossAmount  Total pembayaran UMKM (sebelum fee)
     * @param  float   $fee          Biaya admin/Xendit yang dipotong
     * @param  string  $referenceId  Idempotency key / payment transaction ID
     * @param  string  $description  Keterangan transaksi wallet
     * @return WalletTransaction
     */
    public function credit(
        int $supplierId,
        float $grossAmount,
        float $fee,
        string $referenceId,
        string $description = ''
    ): WalletTransaction {
        // KRITIS: lockForUpdate() mencegah dua webhook mengubah saldo bersamaan.
        // Ini setara dengan SELECT ... FOR UPDATE di SQL level.
        $supplier = SupplierProfile::lockForUpdate()->findOrFail($supplierId);

        $netAmount = $grossAmount - $fee;

        // Tambah saldo bersih ke balance supplier
        $supplier->increment('balance', $netAmount);

        // Catat riwayat transaksi wallet
        $transaction = WalletTransaction::create([
            'supplier_id'  => $supplierId,
            'amount'       => $grossAmount,
            'fee'          => $fee,
            'net_amount'   => $netAmount,
            'type'         => 'income',
            'status'       => 'completed',
            'description'  => $description ?: "Pembayaran invoice (net setelah fee Rp " . number_format($fee, 0, ',', '.') . ")",
            'reference_id' => $referenceId,
        ]);

        Log::info('[WalletService] Credit berhasil', [
            'supplier_id'  => $supplierId,
            'gross'        => $grossAmount,
            'fee'          => $fee,
            'net'          => $netAmount,
            'new_balance'  => $supplier->fresh()->balance,
            'reference_id' => $referenceId,
        ]);

        return $transaction;
    }
}

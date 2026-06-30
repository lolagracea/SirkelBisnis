<?php

namespace App\Services\Payment;

/**
 * FeeCalculatorService — Menghitung biaya admin/MDR berdasarkan metode pembayaran.
 *
 * Tarif (mengikuti standar Xendit Sandbox / regulasi BI):
 *   - QRIS : 0.7% dari nominal (max Rp 1.500)
 *   - VA   : Rp 4.000 flat per transaksi
 */
class FeeCalculatorService
{
    // QRIS MDR (Merchant Discount Rate) sesuai regulasi BI
    private const QRIS_RATE        = 0.007;  // 0.7%
    private const QRIS_MAX_FEE     = 1500;   // Rp 1.500

    // Virtual Account fee (Xendit Sandbox rate)
    private const VA_FLAT_FEE      = 4000;   // Rp 4.000

    /**
     * Hitung fee dan net amount untuk suatu transaksi.
     *
     * @param  float   $amount   Nominal bruto yang dibayarkan UMKM
     * @param  string  $method   'QRIS' atau 'VA'
     * @return array{fee: float, net_amount: float, gross_amount: float}
     */
    public function calculate(float $amount, string $method): array
    {
        $fee = match (strtoupper($method)) {
            'QRIS' => min($amount * self::QRIS_RATE, self::QRIS_MAX_FEE),
            'VA'   => self::VA_FLAT_FEE,
            default => 0,
        };

        // Bulatkan ke atas agar tidak ada pecahan sen
        $fee       = ceil($fee);
        $netAmount = $amount - $fee;

        return [
            'fee'          => (float) $fee,
            'net_amount'   => (float) max($netAmount, 0),
            'gross_amount' => (float) $amount,
        ];
    }
}

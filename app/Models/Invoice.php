<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'order_id',
    'amount',
    'payment_term_days',
    'due_date',
    'status',
    'tax_amount',
    'tax_percentage',
    'payment_method',
])]
class Invoice extends Model
{
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Relasi ke semua payment transaction yang pernah dibuat untuk invoice ini.
     */
    public function paymentTransactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    /**
     * Ambil satu transaksi pembayaran yang aktif (pending atau paid).
     */
    public function activePaymentTransaction(): HasOne
    {
        return $this->hasOne(PaymentTransaction::class)
            ->whereIn('status', ['pending', 'paid'])
            ->latest();
    }

    /**
     * Cek apakah invoice sudah punya transaksi pending yang aktif.
     */
    public function hasPendingTransaction(): bool
    {
        return $this->paymentTransactions()
            ->where('status', 'pending')
            ->exists();
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'xendit_id',
        'payment_method',
        'bank_code',
        'amount',
        'status',
        'qr_string',
        'qr_id',
        'va_number',
        'idempotency_key',
        'paid_at',
        'expired_at',
        'xendit_response',
    ];

    protected $casts = [
        'amount'          => 'decimal:2',
        'paid_at'         => 'datetime',
        'expired_at'      => 'datetime',
        'xendit_response' => 'array',
    ];

    /**
     * Relasi ke Invoice yang dibayar.
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Cek apakah transaksi sudah lunas (idempotency guard).
     */
    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }
}

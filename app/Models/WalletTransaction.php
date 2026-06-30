<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'supplier_id',
        'amount',
        'fee',
        'net_amount',
        'type',
        'status',
        'description',
        'reference_id',
    ];

    protected $casts = [
        'amount'     => 'decimal:2',
        'fee'        => 'decimal:2',
        'net_amount' => 'decimal:2',
    ];

    public function supplierProfile(): BelongsTo
    {
        return $this->belongsTo(SupplierProfile::class, 'supplier_id');
    }
}

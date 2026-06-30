<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierCustomer extends Model
{
    use HasFactory;

    protected $fillable = [
        'supplier_id',
        'umkm_id',
        'tier',
        'discount_percentage',
    ];

    protected $casts = [
        'discount_percentage' => 'float',
    ];

    public function supplierProfile(): BelongsTo
    {
        return $this->belongsTo(SupplierProfile::class, 'supplier_id');
    }

    public function umkmUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'umkm_id');
    }
}

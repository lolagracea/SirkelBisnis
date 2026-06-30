<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'group_buying_id',
    'supplier_id',
    'price_per_unit',
    'total_price',
    'notes',
    'status',
])]
class SupplierOffer extends Model
{
    use HasFactory;

    protected $casts = [
        'price_per_unit' => 'float',
        'total_price'    => 'float',
    ];

    /**
     * Get the group buying this offer belongs to.
     */
    public function groupBuying(): BelongsTo
    {
        return $this->belongsTo(GroupBuying::class);
    }

    /**
     * Get the supplier profile that submitted this offer.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(SupplierProfile::class, 'supplier_id');
    }
}

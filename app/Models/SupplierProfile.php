<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'store_name',
    'warehouse_address',
    'product_category',
    'price',
    'stock',
    'minimum_order',
    'delivery_area',
    'business_tax_number',
])]
class SupplierProfile extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

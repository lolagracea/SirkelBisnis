<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'supplier_id',
    'name',
    'category',
    'description',
    'price',
    'stock',
    'unit',
    'image',
])]
class Product extends Model
{
    use HasFactory;
    /**
     * Get the supplier profile that owns the product.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(SupplierProfile::class, 'supplier_id');
    }

    /**
     * Get the group buying instances associated with the product.
     */
    public function groupBuyings(): HasMany
    {
        return $this->hasMany(GroupBuying::class);
    }

    /**
     * Get the orders associated with this product.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}

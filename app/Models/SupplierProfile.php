<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'supplier_name',
    'description',
    'address',
    'latitude',
    'longitude',
    'verified',
    'rating',
])]
class SupplierProfile extends Model
{
    use HasFactory;
    /**
     * Get the user that owns the supplier profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the products for the supplier profile.
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'supplier_id');
    }

    /**
     * Get the orders received by this supplier.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'supplier_id');
    }
}

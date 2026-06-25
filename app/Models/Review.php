<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'order_id',
    'supplier_id',
    'user_id',
    'rating',
    'comment',
])]
class Review extends Model
{
    use HasFactory;

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'order_id' => 'integer',
        'supplier_id' => 'integer',
        'user_id' => 'integer',
        'rating' => 'integer',
    ];

    /**
     * Get the order associated with this review.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the user (UMKM) who wrote this review.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the supplier profile being reviewed.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(SupplierProfile::class, 'supplier_id');
    }
}

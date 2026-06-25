<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'business_condition',
    'saving_opportunity',
    'group_buying_recommendation',
    'restock_recommendation',
    'business_advice',
])]
class BusinessInsight extends Model
{
    use HasFactory;

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'user_id' => 'integer',
    ];

    /**
     * Get the user that owns the business insight.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'group_buying_id',
    'user_id',
    'quantity',
    'amount',
    'status',
])]
class GroupBuyingMember extends Model
{
    use HasFactory;

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'group_buying_id' => 'integer',
        'user_id' => 'integer',
        'quantity' => 'integer',
        'amount' => 'decimal:2',
    ];

    /**
     * Get the group buying associated with this member.
     */
    public function groupBuying(): BelongsTo
    {
        return $this->belongsTo(GroupBuying::class);
    }

    /**
     * Get the user (UMKM) associated with this member record.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

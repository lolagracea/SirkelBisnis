<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

#[Fillable([
    'product_id',
    'creator_id',
    'target_quantity',
    'current_quantity',
    'min_participants',
    'deadline',
    'status',
])]
class GroupBuying extends Model
{
    use HasFactory;

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'deadline' => 'date',
        'target_quantity' => 'integer',
        'current_quantity' => 'integer',
        'min_participants' => 'integer',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'progress_percentage',
        'participant_count',
        'days_remaining',
        'eligible_for_fulfillment',
    ];

    /**
     * Get the product associated with this group buying.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the creator of this group buying.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    /**
     * Get the members of this group buying.
     */
    public function members(): HasMany
    {
        return $this->hasMany(GroupBuyingMember::class);
    }

    /**
     * Accessor for progress_percentage.
     */
    protected function progressPercentage(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->target_quantity <= 0) {
                    return 0;
                }
                $percentage = ($this->current_quantity / $this->target_quantity) * 100;
                return round($percentage, 2);
            }
        );
    }

    /**
     * Accessor for participant_count.
     */
    protected function participantCount(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->members()->count()
        );
    }

    /**
     * Accessor for days_remaining.
     */
    protected function daysRemaining(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (!$this->deadline) {
                    return 0;
                }
                $deadlineDate = Carbon::parse($this->deadline)->startOfDay();
                $todayDate = Carbon::today();
                $diff = $todayDate->diffInDays($deadlineDate, false);
                return (int) max(0, $diff);
            }
        );
    }

    /**
     * Accessor for eligible_for_fulfillment.
     */
    protected function eligibleForFulfillment(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->participant_count >= $this->min_participants
        );
    }
}

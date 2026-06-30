<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RfqOffer extends Model
{
    use HasFactory;

    protected $fillable = ['rfq_id', 'supplier_price', 'note'];

    public function rfq(): BelongsTo
    {
        return $this->belongsTo(Rfq::class);
    }
}

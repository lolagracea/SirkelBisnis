<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockLedger extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'change_amount',
        'reason',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}

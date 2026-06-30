<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SponsoredProduct extends Model
{
    use HasFactory;

    protected $fillable = ['supplier_id', 'product_id', 'cpc_bid', 'daily_budget', 'start_date', 'end_date', 'status', 'clicks'];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(SupplierProfile::class, 'supplier_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

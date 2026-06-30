<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WalletTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'supplier_id',
        'amount',
        'type',
        'status',
        'description',
    ];

    public function supplierProfile()
    {
        return $this->belongsTo(SupplierProfile::class, 'supplier_id');
    }
}

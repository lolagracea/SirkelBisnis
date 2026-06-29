<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kecamatan extends Model
{
    protected $fillable = ['emsifa_id', 'city_id', 'name'];

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function kelurahans(): HasMany
    {
        return $this->hasMany(Kelurahan::class);
    }
}

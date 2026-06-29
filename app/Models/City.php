<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class City extends Model
{
    use HasFactory;

    protected $fillable = ['emsifa_id', 'name', 'province'];

    public function kecamatans()
    {
        return $this->hasMany(Kecamatan::class);
    }
}

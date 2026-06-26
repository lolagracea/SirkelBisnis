<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\City;
use App\Models\BusinessType;
use Illuminate\Support\Facades\Cache;

class ReferenceController extends Controller
{
    public function getCities()
    {
        $cities = Cache::rememberForever('cities_all', function () {
            return City::select('id', 'name')->orderBy('name', 'asc')->get()->toArray();
        });

        return response()->json([
            'success' => true,
            'data' => $cities
        ], 200);
    }

    public function getBusinessTypes()
    {
        $businessTypes = Cache::rememberForever('business_types_all', function () {
            return BusinessType::select('id', 'name')->orderBy('name', 'asc')->get()->toArray();
        });

        return response()->json([
            'success' => true,
            'data' => $businessTypes
        ], 200);
    }
}

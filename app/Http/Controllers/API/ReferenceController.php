<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BusinessType;
use App\Models\City;
use App\Models\Kecamatan;
use App\Models\Kelurahan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class ReferenceController extends Controller
{
    public function getCities()
    {
        $cities = Cache::rememberForever('cities_all', function () {
            return City::select('id', 'name', 'province')
                ->orderBy('name')
                ->get()
                ->toArray();
        });

        return response()->json(['success' => true, 'data' => $cities]);
    }

    public function getBusinessTypes()
    {
        $businessTypes = Cache::rememberForever('business_types_all', function () {
            return BusinessType::select('id', 'name')->orderBy('name')->get()->toArray();
        });

        return response()->json(['success' => true, 'data' => $businessTypes]);
    }

    public function getProvinces()
    {
        $provinces = Cache::rememberForever('provinces_all', function () {
            return City::select('province')
                ->whereNotNull('province')
                ->distinct()
                ->orderBy('province')
                ->pluck('province')
                ->values()
                ->toArray();
        });

        return response()->json(['success' => true, 'data' => $provinces]);
    }

    public function getCitiesByProvince(Request $request)
    {
        $province = $request->query('province');

        if (!$province) {
            return response()->json(['success' => false, 'message' => 'Parameter province wajib diisi.'], 422);
        }

        $cacheKey = 'cities_province_' . md5($province);

        $cities = Cache::rememberForever($cacheKey, function () use ($province) {
            return City::select('id', 'name')
                ->where('province', $province)
                ->orderBy('name')
                ->get()
                ->toArray();
        });

        return response()->json(['success' => true, 'data' => $cities]);
    }

    public function getKecamatanByCity(Request $request)
    {
        $cityId = $request->query('city_id');

        if (!$cityId) {
            return response()->json(['success' => false, 'message' => 'Parameter city_id wajib diisi.'], 422);
        }

        $cacheKey = 'kecamatan_city_' . $cityId;

        $kecamatans = Cache::rememberForever($cacheKey, function () use ($cityId) {
            return Kecamatan::select('id', 'name')
                ->where('city_id', $cityId)
                ->orderBy('name')
                ->get()
                ->toArray();
        });

        return response()->json(['success' => true, 'data' => $kecamatans]);
    }

    public function getKelurahanByKecamatan(Request $request)
    {
        $kecamatanId = $request->query('kecamatan_id');

        if (!$kecamatanId) {
            return response()->json(['success' => false, 'message' => 'Parameter kecamatan_id wajib diisi.'], 422);
        }

        $cacheKey = 'kelurahan_kecamatan_' . $kecamatanId;

        $kelurahans = Cache::rememberForever($cacheKey, function () use ($kecamatanId) {
            // Cek apakah kelurahan sudah ada di DB
            $existing = Kelurahan::where('kecamatan_id', $kecamatanId)->count();

            if ($existing > 0) {
                return Kelurahan::select('id', 'name')
                    ->where('kecamatan_id', $kecamatanId)
                    ->orderBy('name')
                    ->get()
                    ->toArray();
            }

            // Lazy fetch dari emsifa
            $kecamatan = Kecamatan::find($kecamatanId);
            if (!$kecamatan) return [];

            $villages = Http::timeout(30)
                ->get("https://emsifa.github.io/api-wilayah-indonesia/api/villages/{$kecamatan->emsifa_id}.json")
                ->json();

            if (!$villages) return [];

            $now  = now();
            $rows = array_map(fn($v) => [
                'emsifa_id'    => $v['id'],
                'kecamatan_id' => $kecamatanId,
                'name'         => $v['name'],
                'created_at'   => $now,
                'updated_at'   => $now,
            ], $villages);

            foreach (array_chunk($rows, 200) as $chunk) {
                Kelurahan::insert($chunk);
            }

            return Kelurahan::select('id', 'name')
                ->where('kecamatan_id', $kecamatanId)
                ->orderBy('name')
                ->get()
                ->toArray();
        });

        return response()->json(['success' => true, 'data' => $kelurahans]);
    }
}

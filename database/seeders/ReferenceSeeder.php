<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\Kecamatan;
use App\Models\BusinessType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class ReferenceSeeder extends Seeder
{
    private string $base = 'https://emsifa.github.io/api-wilayah-indonesia/api';

    public function run(): void
    {
        // 1. Business Types
        $businessTypes = [
            'Pertanian & Perkebunan', 'Peternakan', 'Perikanan', 'Pertambangan',
            'Industri Pengolahan (Manufaktur)', 'Konstruksi / Bangunan',
            'Perdagangan Besar (Grosir)', 'Perdagangan Eceran (Retail)',
            'Kuliner (F&B, Restoran, Cafe)', 'Akomodasi (Hotel, Penginapan)',
            'Transportasi & Logistik', 'Informasi & Komunikasi (IT, Telco)',
            'Jasa Keuangan & Asuransi', 'Real Estate / Properti',
            'Jasa Profesional (Konsultan, Agensi)', 'Pendidikan & Pelatihan',
            'Kesehatan & Farmasi', 'Kesenian, Hiburan & Rekreasi',
            'Jasa Perawatan (Salon, Spa)', 'Jasa Reparasi & Otomotif',
            'Konveksi & Pakaian', 'Percetakan & Desain', 'Event Organizer',
            'Kerajinan (Kriya)', 'Pertamanan & Lanskap',
        ];

        BusinessType::query()->delete();
        foreach ($businessTypes as $type) {
            BusinessType::create(['name' => $type]);
        }
        $this->command->info('Jenis Usaha seeded.');

        // 2. Cities + Kecamatan dari emsifa
        Kecamatan::query()->delete();
        City::query()->delete();

        $this->command->info('Fetching provinces dari emsifa...');
        $provinces = Http::timeout(30)->get("{$this->base}/provinces.json")->json();

        if (!$provinces) {
            $this->command->error('Gagal fetch provinces.');
            return;
        }

        $cityInsert = [];
        $kecamatanInsert = [];
        $now = now();

        foreach ($provinces as $prov) {
            $provName = $prov['name'];
            $provId   = $prov['id'];

            $regencies = Http::timeout(30)->get("{$this->base}/regencies/{$provId}.json")->json();
            if (!$regencies) continue;

            foreach ($regencies as $reg) {
                $cityInsert[] = [
                    'emsifa_id'  => $reg['id'],
                    'name'       => $reg['name'],
                    'province'   => $provName,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            $this->command->info("  Province {$provName}: " . count($regencies) . " kota/kab");
        }

        foreach (array_chunk($cityInsert, 500) as $chunk) {
            City::insert($chunk);
        }
        $this->command->info('Cities seeded: ' . count($cityInsert));

        // 3. Seed Kecamatan
        $this->command->info('Seeding kecamatan (ini mungkin membutuhkan beberapa menit)...');
        $cities = City::all(['id', 'emsifa_id']);
        $total  = 0;

        foreach ($cities as $city) {
            $districts = Http::timeout(30)->get("{$this->base}/districts/{$city->emsifa_id}.json")->json();
            if (!$districts) continue;

            $rows = array_map(fn($d) => [
                'emsifa_id'  => $d['id'],
                'city_id'    => $city->id,
                'name'       => $d['name'],
                'created_at' => $now,
                'updated_at' => $now,
            ], $districts);

            foreach (array_chunk($rows, 200) as $chunk) {
                Kecamatan::insert($chunk);
            }
            $total += count($districts);
        }

        $this->command->info("Kecamatan seeded: {$total}");

        // Flush cache
        Cache::forget('provinces_all');
        Cache::forget('cities_all');
        $this->command->info('Cache cleared.');
    }
}

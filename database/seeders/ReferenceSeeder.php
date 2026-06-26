<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\City;
use App\Models\BusinessType;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class ReferenceSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Business Types
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
            'Kerajinan (Kriya)', 'Pertamanan & Lanskap'
        ];
        
        BusinessType::query()->delete();
        foreach ($businessTypes as $type) {
            BusinessType::create(['name' => $type]);
        }
        $this->command->info('Jenis Usaha seeded successfully.');

        // 2. Seed Cities from Public JSON
        City::query()->delete();
        $this->command->info('Fetching provinces and regencies...');
        
        $url = 'https://raw.githubusercontent.com/mtegarsantosa/json-nama-daerah-indonesia/master/regions.json';
        $provinces = Http::get($url)->json();

        if ($provinces) {
            $insertData = [];
            foreach ($provinces as $province) {
                if (isset($province['kota'])) {
                    foreach ($province['kota'] as $kota) {
                        $insertData[] = [
                            'name' => $kota,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                }
            }
            
            // Insert in chunks to avoid memory/query limits
            foreach (array_chunk($insertData, 500) as $chunk) {
                City::insert($chunk);
            }
            
            $this->command->info('All Kabupaten/Kota seeded successfully.');
        } else {
            $this->command->error('Failed to fetch cities data.');
        }

        // 3. Clear Cache
        Cache::forget('cities_all');
        Cache::forget('business_types_all');
        $this->command->info('Cache cleared.');
    }
}

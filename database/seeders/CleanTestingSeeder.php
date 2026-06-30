<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\SupplierProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CleanTestingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Seed Roles & Permissions
        $this->call([
            RolePermissionSeeder::class,
            AdminSeeder::class,
        ]);

        // 2. Create the standard Supplier testing account
        $supplierUser = User::updateOrCreate(
            ['email' => 'supplier@sirkelbisnis.com'],
            [
                'name' => 'Supplier Utama',
                'phone_number' => '081234567891',
                'role' => 'supplier',
                'account_status' => 'active',
                'password' => Hash::make('password'),
            ]
        );
        $supplierUser->assignRole('supplier');

        SupplierProfile::updateOrCreate(
            ['user_id' => $supplierUser->id],
            [
                'supplier_name' => 'Mitra Tani Jaya',
                'description' => 'Supplier utama penyedia berbagai macam tepung terigu, tapioka, minyak goreng, dan bawang putih kating berkualitas premium.',
                'address' => 'Jl. Sukarno Hatta No. 45, Malang',
                'latitude' => -7.983,
                'longitude' => 112.621,
                'verified' => true,
                'rating' => 5.0,
            ]
        );

        // 3. Create the standard UMKM testing account
        $umkmUser = User::updateOrCreate(
            ['email' => 'umkm1@sirkelbisnis.com'],
            [
                'name' => 'UMKM Owner 1',
                'email' => 'umkm1@sirkelbisnis.com',
                'phone_number' => '089876543001',
                'nik' => '3201234567890001',
                'role' => 'umkm',
                'account_status' => 'active',
                'password' => Hash::make('password'),
            ]
        );
        $umkmUser->assignRole('umkm');

        $umkmUser->umkmProfile()->updateOrCreate(
            ['user_id' => $umkmUser->id],
            [
                'business_name' => 'Bisnis UMKM 1',
                'business_type' => 'Kuliner',
                'business_address' => 'Jl. Merdeka No. 10, Malang',
                'district_city' => 'Malang',
                'raw_material_category' => 'Bahan Pangan',
                'monthly_need_estimate' => 300,
            ]
        );
    }
}

<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\SupplierProfile;
use Illuminate\Database\Seeder;

class SupplierProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create 1 fixed supplier account
        $fixedUser = \App\Models\User::updateOrCreate(
            ['email' => 'supplier@sirkelbisnis.com'],
            [
                'name' => 'Supplier Utama',
                'phone_number' => '081234567891',
                'role' => 'supplier',
                'account_status' => 'active',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
            ]
        );
        $fixedUser->assignRole('supplier');

        $fixedProfile = \App\Models\SupplierProfile::updateOrCreate(
            ['user_id' => $fixedUser->id],
            [
                'supplier_name' => 'Mitra Tani Jaya',
                'description' => 'Supplier utama penyedia berbagai macam tepung terigu, tapioka, minyak goreng, dan bawang putih kating berkualitas premium.',
                'address' => 'Jl. Sukarno Hatta No. 45, Malang',
                'latitude' => -7.983,
                'longitude' => 112.621,
                'verified' => true,
                'rating' => 4.8,
            ]
        );

        Product::create([
            'supplier_id' => $fixedProfile->id,
            'name' => 'Bawang Putih Kating',
            'category' => 'Bumbu',
            'description' => 'Bawang putih kating kupas bersih, segar dan harum.',
            'price' => 35000.00,
            'stock' => 500,
            'unit' => 'kg',
            'image' => 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=400&q=80',
        ]);

        Product::create([
            'supplier_id' => $fixedProfile->id,
            'name' => 'Tepung Tapioka Segitiga',
            'category' => 'Tepung',
            'description' => 'Tepung tapioka berkualitas tinggi cocok untuk bakso dan cilok.',
            'price' => 12000.00,
            'stock' => 1000,
            'unit' => 'kg',
            'image' => 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=400&q=80',
        ]);

        // Create 5 other random suppliers
        $suppliers = SupplierProfile::factory()
            ->count(5)
            ->create();

        // For each supplier, assign the role 'supplier' and create 4 products (total 20 products)
        foreach ($suppliers as $supplier) {
            // Assign Spatie role
            $supplier->user->assignRole('supplier');

            Product::factory()
                ->count(4)
                ->create([
                    'supplier_id' => $supplier->id,
                ]);
        }
    }
}

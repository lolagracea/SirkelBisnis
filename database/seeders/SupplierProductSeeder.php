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
        // Create 5 suppliers (each with a User and a SupplierProfile)
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

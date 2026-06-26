<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\SupplierProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categories = ['Bahan Pangan', 'Kemasan', 'Bumbu Dapur', 'Alat Tulis', 'Peralatan', 'Elektronik'];
        $units = ['kg', 'liter', 'pcs', 'box', 'pack', 'karung'];
        $category = fake()->randomElement($categories);

        $images = [
            'Bahan Pangan' => 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=400&q=80',
            'Kemasan' => 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80',
            'Bumbu Dapur' => 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
            'Alat Tulis' => 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=400&q=80',
            'Peralatan' => 'https://images.unsplash.com/photo-1530124560072-aae8002bd09b?auto=format&fit=crop&w=400&q=80',
            'Elektronik' => 'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=400&q=80',
        ];

        return [
            'supplier_id' => SupplierProfile::factory(),
            'name' => fake()->words(3, true),
            'category' => $category,
            'description' => fake()->sentence(),
            'price' => fake()->randomFloat(2, 5000, 1000000),
            'stock' => fake()->numberBetween(10, 1000),
            'unit' => fake()->randomElement($units),
            'image' => $images[$category] ?? 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=400&q=80',
        ];
    }
}

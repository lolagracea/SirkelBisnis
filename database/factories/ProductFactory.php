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

        return [
            'supplier_id' => SupplierProfile::factory(),
            'name' => fake()->words(3, true),
            'category' => fake()->randomElement($categories),
            'description' => fake()->sentence(),
            'price' => fake()->randomFloat(2, 5000, 1000000),
            'stock' => fake()->numberBetween(10, 1000),
            'unit' => fake()->randomElement($units),
            'image' => fake()->imageUrl(640, 480, 'business', true),
        ];
    }
}

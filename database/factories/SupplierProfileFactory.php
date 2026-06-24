<?php

namespace Database\Factories;

use App\Models\SupplierProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SupplierProfile>
 */
class SupplierProfileFactory extends Factory
{
    protected $model = SupplierProfile::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state(['role' => 'supplier']),
            'supplier_name' => fake()->company() . ' Supplier',
            'description' => fake()->paragraph(),
            'address' => fake()->address(),
            'latitude' => fake()->latitude(-8.8, -6.0),
            'longitude' => fake()->longitude(105.0, 114.0),
            'verified' => fake()->boolean(50),
            'rating' => fake()->randomFloat(2, 0, 5),
        ];
    }
}

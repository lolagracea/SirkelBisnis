<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Review;
use App\Models\SupplierProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    protected $model = Review::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory()->state(['status' => 'completed']),
            'supplier_id' => SupplierProfile::factory(),
            'user_id' => User::factory()->state(['role' => 'umkm']),
            'rating' => $this->faker->numberBetween(1, 5),
            'comment' => $this->faker->realTextBetween(15, 200),
        ];
    }
}

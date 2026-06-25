<?php

namespace Database\Factories;

use App\Models\GroupBuying;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<GroupBuying>
 */
class GroupBuyingFactory extends Factory
{
    protected $model = GroupBuying::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'creator_id' => User::factory()->state(['role' => 'umkm']),
            'target_quantity' => $this->faker->numberBetween(100, 1000),
            'current_quantity' => 0,
            'min_participants' => $this->faker->numberBetween(2, 6),
            'deadline' => Carbon::tomorrow()->addDays($this->faker->numberBetween(1, 30)),
            'status' => 'open',
        ];
    }
}

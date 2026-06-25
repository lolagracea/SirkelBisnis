<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Product;
use App\Models\SupplierProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    protected static int $orderSequence = 1;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = $this->faker->numberBetween(5, 100);
        $unitPrice = $this->faker->randomFloat(2, 5000, 100000);
        $totalPrice = $quantity * $unitPrice;

        $orderCode = 'ORD-2026-' . str_pad(self::$orderSequence++, 5, '0', STR_PAD_LEFT);

        return [
            'order_code' => $orderCode,
            'buyer_id' => User::factory()->state(['role' => 'umkm']),
            'supplier_id' => SupplierProfile::factory(),
            'product_id' => Product::factory(),
            'group_buying_id' => null,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'total_price' => $totalPrice,
            'type' => 'single',
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'notes' => $this->faker->sentence(),
        ];
    }
}

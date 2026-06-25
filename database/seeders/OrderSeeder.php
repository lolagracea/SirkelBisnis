<?php

namespace Database\Seeders;

use App\Models\GroupBuying;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    protected OrderService $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $umkmUsers = User::where('role', 'umkm')->get();
        $products = Product::all();

        if ($umkmUsers->isEmpty() || $products->isEmpty()) {
            return;
        }

        // 1. Seed 15 Single Orders
        for ($i = 0; $i < 15; $i++) {
            $buyer = $umkmUsers->random();
            $product = $products->random();
            $quantity = fake()->numberBetween(10, 80);
            $unitPrice = $product->price;
            $totalPrice = $quantity * $unitPrice;
            
            $status = fake()->randomElement(['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled']);
            $paymentStatus = in_array($status, ['pending', 'cancelled']) ? 'unpaid' : 'paid';

            Order::create([
                'order_code' => $this->orderService->generateOrderCode(),
                'buyer_id' => $buyer->id,
                'supplier_id' => $product->supplier_id,
                'product_id' => $product->id,
                'group_buying_id' => null,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total_price' => $totalPrice,
                'type' => 'single',
                'status' => $status,
                'payment_status' => $paymentStatus,
                'notes' => fake()->sentence(),
            ]);
        }

        // 2. Seed Group Orders from existing Group Buying campaigns
        $groupBuyings = GroupBuying::with('members')->get();
        
        foreach ($groupBuyings as $group) {
            if (Order::count() >= 30) {
                break;
            }
            
            // Generate orders for members
            $this->orderService->createGroupBuyingOrders($group);
        }

        // 3. Fallback: Seed more single orders if total count is still under 30
        while (Order::count() < 30) {
            $buyer = $umkmUsers->random();
            $product = $products->random();
            $quantity = fake()->numberBetween(5, 50);
            $unitPrice = $product->price;
            $totalPrice = $quantity * $unitPrice;

            Order::create([
                'order_code' => $this->orderService->generateOrderCode(),
                'buyer_id' => $buyer->id,
                'supplier_id' => $product->supplier_id,
                'product_id' => $product->id,
                'group_buying_id' => null,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total_price' => $totalPrice,
                'type' => 'single',
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'notes' => fake()->sentence(),
            ]);
        }
    }
}

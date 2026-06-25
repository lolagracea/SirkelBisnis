<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use App\Services\OrderService;
use App\Services\ReviewService;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    protected OrderService $orderService;
    protected ReviewService $reviewService;

    public function __construct(OrderService $orderService, ReviewService $reviewService)
    {
        $this->orderService = $orderService;
        $this->reviewService = $reviewService;
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

        // 1. Ensure we have at least 50 completed orders without reviews
        $completedOrdersWithoutReviews = Order::where('status', 'completed')
            ->whereDoesntHave('review')
            ->get();

        $neededCompletedOrders = 50 - $completedOrdersWithoutReviews->count();

        if ($neededCompletedOrders > 0) {
            for ($i = 0; $i < $neededCompletedOrders; $i++) {
                $buyer = $umkmUsers->random();
                $product = $products->random();
                $quantity = fake()->numberBetween(5, 50);
                $unitPrice = $product->price;
                $totalPrice = $quantity * $unitPrice;

                $order = Order::create([
                    'order_code' => $this->orderService->generateOrderCode(),
                    'buyer_id' => $buyer->id,
                    'supplier_id' => $product->supplier_id,
                    'product_id' => $product->id,
                    'group_buying_id' => null,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'total_price' => $totalPrice,
                    'type' => 'single',
                    'status' => 'completed',
                    'payment_status' => 'paid',
                    'notes' => 'Pesanan khusus seeder ulasan.',
                ]);

                $completedOrdersWithoutReviews->push($order);
            }
        }

        // Refresh database collection to make sure we have exactly 50 unique orders to review
        $ordersToReview = Order::where('status', 'completed')
            ->whereDoesntHave('review')
            ->limit(50)
            ->get();

        // 2. Create 50 Reviews for these completed orders
        $supplierIdsToUpdate = [];

        foreach ($ordersToReview as $order) {
            Review::create([
                'order_id' => $order->id,
                'supplier_id' => $order->supplier_id,
                'user_id' => $order->buyer_id, // The buyer of the order reviews it
                'rating' => fake()->numberBetween(1, 5),
                'comment' => fake()->realTextBetween(15, 300),
            ]);

            $supplierIdsToUpdate[] = $order->supplier_id;
        }

        // 3. Recalculate rating for all affected suppliers
        $uniqueSupplierIds = array_unique($supplierIdsToUpdate);
        foreach ($uniqueSupplierIds as $supplierId) {
            $this->reviewService->calculateSupplierRating($supplierId);
        }
    }
}

<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\SupplierProfile;
use App\Models\User;
use App\Services\OrderService;
use App\Services\ReviewService;
use App\Services\SirkelScoreService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SirkelScoreSeeder extends Seeder
{
    protected OrderService $orderService;
    protected ReviewService $reviewService;
    protected SirkelScoreService $sirkelScoreService;

    public function __construct(
        OrderService $orderService,
        ReviewService $reviewService,
        SirkelScoreService $sirkelScoreService
    ) {
        $this->orderService = $orderService;
        $this->reviewService = $reviewService;
        $this->sirkelScoreService = $sirkelScoreService;
    }

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $umkmUsers = User::where('role', 'umkm')->get();
        if ($umkmUsers->isEmpty()) {
            return;
        }

        // 1. Ensure we have at least 20 suppliers
        $suppliersCount = SupplierProfile::count();
        $neededSuppliers = 20 - $suppliersCount;

        if ($neededSuppliers > 0) {
            for ($i = 1; $i <= $neededSuppliers; $i++) {
                $user = User::create([
                    'name' => "Supplier Seeded {$i}",
                    'email' => "supplier_seeded_{$i}@sirkelbisnis.com",
                    'phone_number' => "08555666" . str_pad($i, 4, '0', STR_PAD_LEFT),
                    'nik' => "3202345678901" . str_pad($i, 3, '0', STR_PAD_LEFT),
                    'role' => 'supplier',
                    'account_status' => 'active',
                    'password' => Hash::make('password'),
                ]);

                $user->assignRole('supplier');

                SupplierProfile::create([
                    'user_id' => $user->id,
                    'supplier_name' => "Seeded Supplier Co {$i}",
                    'description' => "Seeded Supplier description {$i}",
                    'address' => "Jalan Seeded No. {$i}",
                    'verified' => true,
                    'rating' => 0.00,
                ]);
            }
        }

        // Fetch all 20 suppliers
        $suppliers = SupplierProfile::all();

        // 2. Seed products, orders, and reviews for each supplier to calculate realistic scores
        foreach ($suppliers as $supplier) {
            // Seed 3 products if none exist
            $productsCount = Product::where('supplier_id', $supplier->id)->count();
            if ($productsCount === 0) {
                for ($p = 1; $p <= 3; $p++) {
                    Product::create([
                        'supplier_id' => $supplier->id,
                        'name' => "Bahan Mentah {$supplier->id} - {$p}",
                        'category' => 'Bahan Pangan',
                        'description' => 'Bahan pangan berkualitas.',
                        'price' => fake()->randomFloat(2, 5000, 50000),
                        'stock' => fake()->numberBetween(10, 500),
                        'unit' => 'kg',
                    ]);
                }
            }

            // Get product
            $supplierProduct = Product::where('supplier_id', $supplier->id)->first();
            if (!$supplierProduct) {
                continue;
            }

            // Seed 5 to 10 orders for this supplier
            $ordersCount = Order::where('supplier_id', $supplier->id)->count();
            if ($ordersCount < 5) {
                $ordersToSeed = fake()->numberBetween(5, 10);
                for ($o = 1; $o <= $ordersToSeed; $o++) {
                    $buyer = $umkmUsers->random();
                    $quantity = fake()->numberBetween(5, 50);
                    $unitPrice = $supplierProduct->price;
                    $totalPrice = $quantity * $unitPrice;

                    $status = fake()->randomElement(['completed', 'completed', 'completed', 'shipped', 'cancelled', 'processing']);
                    $paymentStatus = in_array($status, ['pending', 'cancelled']) ? 'unpaid' : 'paid';

                    $order = Order::create([
                        'order_code' => $this->orderService->generateOrderCode(),
                        'buyer_id' => $buyer->id,
                        'supplier_id' => $supplier->id,
                        'product_id' => $supplierProduct->id,
                        'group_buying_id' => null,
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'total_price' => $totalPrice,
                        'type' => 'single',
                        'status' => $status,
                        'payment_status' => $paymentStatus,
                    ]);

                    // Seed review for completed orders (70% chance)
                    if ($status === 'completed' && fake()->boolean(70)) {
                        Review::create([
                            'order_id' => $order->id,
                            'supplier_id' => $supplier->id,
                            'user_id' => $buyer->id,
                            'rating' => fake()->numberBetween(3, 5),
                            'comment' => 'Ulasan otomatis produk yang sangat memuaskan dari seeder.',
                        ]);
                    }
                }
            }

            // Update supplier rating and score
            $this->reviewService->calculateSupplierRating($supplier->id);
            $this->sirkelScoreService->updateSupplierScore($supplier);
        }
    }
}

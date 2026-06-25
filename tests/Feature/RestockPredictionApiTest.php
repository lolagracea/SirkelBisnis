<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\SupplierProfile;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RestockPredictionApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $umkmUser;
    protected User $supplierUser;
    protected SupplierProfile $supplierProfile;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles & permissions
        $this->seed(RolePermissionSeeder::class);

        // Create UMKM user
        $this->umkmUser = User::factory()->create(['role' => 'umkm']);
        $this->umkmUser->assignRole('umkm');
        $this->umkmUser->umkmProfile()->create([
            'business_name' => 'Sirkel UMKM',
            'business_type' => 'Makanan',
            'business_address' => 'Malang',
            'district_city' => 'Malang',
            'raw_material_category' => 'Tepung',
            'monthly_need_estimate' => 300, // 300 per month = 10 per day
        ]);

        // Create Supplier user
        $this->supplierUser = User::factory()->create(['role' => 'supplier']);
        $this->supplierUser->assignRole('supplier');
        $this->supplierProfile = SupplierProfile::factory()->create([
            'user_id' => $this->supplierUser->id,
            'rating' => 0.00,
            'sirkel_score' => 0.00,
        ]);

        // Create Product
        $this->product = Product::factory()->create([
            'supplier_id' => $this->supplierProfile->id,
            'stock' => 100,
        ]);
    }

    /**
     * Test route is protected and rejects unauthenticated requests.
     */
    public function test_route_requires_authentication(): void
    {
        $response = $this->getJson('/api/ai/restock');
        $response->assertStatus(401);
    }

    /**
     * Test route rejects non-UMKM users.
     */
    public function test_route_rejects_non_umkm_users(): void
    {
        $response = $this->actingAs($this->supplierUser, 'sanctum')
            ->getJson('/api/ai/restock');

        $response->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Hanya pengguna dengan peran UMKM yang dapat mengakses prediksi restock.');
    }

    /**
     * Test restock prediction using fallback profile monthly estimate.
     */
    public function test_fallback_prediction_with_zero_order_history(): void
    {
        // Monthly estimate is 300 (10 units per day)
        // With current_stock = 60, days remaining should be floor(60 / 10) = 6 days.
        // Status should be restock_soon.
        $expectedDate = Carbon::now()->addDays(6)->toDateString();

        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson('/api/ai/restock?current_stock=60');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Restock prediction calculated successfully.')
            ->assertJsonPath('data.days_remaining', 6)
            ->assertJsonPath('data.estimated_restock_date', $expectedDate)
            ->assertJsonPath('data.recommended_quantity', 300)
            ->assertJsonPath('data.status', 'restock_soon');
    }

    /**
     * Test restock prediction calculated from order history.
     */
    public function test_prediction_calculated_from_completed_order_history(): void
    {
        // 1. Setup completed orders at known intervals
        // Order 1: 10 days ago, quantity = 50
        $order1 = Order::create([
            'order_code' => 'ORD-2026-77771',
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $this->product->id,
            'quantity' => 50,
            'unit_price' => 2000.00,
            'total_price' => 100000.00,
            'type' => 'single',
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);

        \Illuminate\Support\Facades\DB::table('orders')
            ->where('id', $order1->id)
            ->update([
                'created_at' => Carbon::now()->subDays(10),
                'updated_at' => Carbon::now()->subDays(10),
            ]);

        // Order 2: today, quantity = 50
        $order2 = Order::create([
            'order_code' => 'ORD-2026-77772',
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $this->product->id,
            'quantity' => 50,
            'unit_price' => 2000.00,
            'total_price' => 100000.00,
            'type' => 'single',
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);

        \Illuminate\Support\Facades\DB::table('orders')
            ->where('id', $order2->id)
            ->update([
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);


        // Total Days = 10. Avg Days = 10 / (2-1) = 10 days.
        // Avg Quantity = 50.
        // Daily rate = 50 / 10 = 5.0 units/day.
        // With current_stock = 12, days remaining = floor(12 / 5.0) = 2 days.
        // Status should be restock_now (since days_remaining <= 2).
        $expectedDate = Carbon::now()->addDays(2)->toDateString();

        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson('/api/ai/restock?current_stock=12');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.days_remaining', 2)
            ->assertJsonPath('data.estimated_restock_date', $expectedDate)
            ->assertJsonPath('data.recommended_quantity', 50)
            ->assertJsonPath('data.status', 'restock_now');
    }

    /**
     * Test prediction status is 'safe' when days remaining is high.
     */
    public function test_prediction_status_is_safe_when_days_remaining_high(): void
    {
        // Monthly estimate is 300 (10 units per day)
        // With current_stock = 100, days remaining = floor(100 / 10) = 10 days.
        // Status should be safe (> 7).
        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson('/api/ai/restock?current_stock=100');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.days_remaining', 10)
            ->assertJsonPath('data.status', 'safe');
    }
}

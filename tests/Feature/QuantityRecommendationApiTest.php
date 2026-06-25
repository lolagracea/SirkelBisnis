<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\SupplierProfile;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuantityRecommendationApiTest extends TestCase
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
            'monthly_need_estimate' => 300, // 300 per month
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
        $response = $this->getJson('/api/ai/recommend-quantity');
        $response->assertStatus(401);
    }

    /**
     * Test route rejects non-UMKM users.
     */
    public function test_route_rejects_non_umkm_users(): void
    {
        $response = $this->actingAs($this->supplierUser, 'sanctum')
            ->getJson('/api/ai/recommend-quantity');

        $response->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Hanya pengguna dengan peran UMKM yang dapat mengakses rekomendasi kuantitas.');
    }

    /**
     * Test quantity recommendation using fallback profile monthly estimate.
     */
    public function test_fallback_recommendation_with_zero_order_history(): void
    {
        // Monthly estimate is 300
        // Baseline = 300 / 6 = 50.
        // Min Safe = 50 * 0.8 = 40.
        // Max Safe = 50 * 1.2 = 60.
        // With current_stock = 12, recommended = 60 - 12 = 48.
        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson('/api/ai/recommend-quantity?current_stock=12');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Quantity recommendation calculated successfully.')
            ->assertJsonPath('data.minimum_safe_quantity', 40)
            ->assertJsonPath('data.maximum_safe_quantity', 60)
            ->assertJsonPath('data.recommended_quantity', 48);
    }

    /**
     * Test quantity recommendation calculated from order history.
     */
    public function test_recommendation_calculated_from_order_history(): void
    {
        // 1. Setup completed orders
        for ($i = 1; $i <= 5; $i++) {
            Order::create([
                'order_code' => 'ORD-2026-6666' . $i,
                'buyer_id' => $this->umkmUser->id,
                'supplier_id' => $this->supplierProfile->id,
                'product_id' => $this->product->id,
                'quantity' => 80,
                'unit_price' => 2000.00,
                'total_price' => 160000.00,
                'type' => 'single',
                'status' => 'completed',
                'payment_status' => 'paid',
            ]);
        }

        // Avg quantity = 80
        // Min Safe = 80 * 0.8 = 64
        // Max Safe = 80 * 1.2 = 96
        // With current_stock = 20, recommended = 96 - 20 = 76
        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson('/api/ai/recommend-quantity?current_stock=20');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.minimum_safe_quantity', 64)
            ->assertJsonPath('data.maximum_safe_quantity', 96)
            ->assertJsonPath('data.recommended_quantity', 76);
    }
}

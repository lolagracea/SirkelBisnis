<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\SupplierProfile;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PriceAnalysisApiTest extends TestCase
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
            'raw_material_category' => 'Ubi',
            'monthly_need_estimate' => 200,
        ]);

        // Create Supplier user
        $this->supplierUser = User::factory()->create(['role' => 'supplier']);
        $this->supplierUser->assignRole('supplier');
        $this->supplierProfile = SupplierProfile::factory()->create([
            'user_id' => $this->supplierUser->id,
            'rating' => 0.00,
            'sirkel_score' => 0.00,
        ]);

        // Create Product (current price = 12000)
        $this->product = Product::factory()->create([
            'supplier_id' => $this->supplierProfile->id,
            'category' => 'Ubi',
            'price' => 12000.00,
            'stock' => 100,
        ]);
    }

    /**
     * Test route is protected and rejects unauthenticated requests.
     */
    public function test_route_requires_authentication(): void
    {
        $response = $this->getJson("/api/ai/price-analysis/{$this->product->id}");
        $response->assertStatus(401);
    }

    /**
     * Test green status mapping with exact example numbers:
     * Current price = 12000, Market Average = 13000 -> Diff percent = -8% -> status green.
     */
    public function test_green_status_price_anomaly(): void
    {
        // Setup another product in the same category to create historical completed orders
        $otherProduct = Product::factory()->create([
            'supplier_id' => $this->supplierProfile->id,
            'category' => 'Ubi',
            'price' => 13000.00,
        ]);

        Order::create([
            'order_code' => 'ORD-2026-55551',
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $otherProduct->id,
            'quantity' => 10,
            'unit_price' => 13000.00,
            'total_price' => 130000.00,
            'type' => 'single',
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);

        // Market Average = 13000.
        // Current Price = 12000.
        // Diff percentage = round((12000 - 13000) / 13000 * 100) = -8%
        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson("/api/ai/price-analysis/{$this->product->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'green')
            ->assertJsonPath('data.difference_percentage', -8)
            ->assertJsonPath('data.market_average', 13000)
            ->assertJsonPath('data.current_price', 12000)
            ->assertJsonPath('data.summary', 'Harga lebih rendah dari rata-rata pasar.');

    }

    /**
     * Test yellow status mapping (between 11% and 30% above average):
     * Current price = 12500, Market Average = 10000 -> Diff percent = 25% -> status yellow.
     */
    public function test_yellow_status_price_anomaly(): void
    {
        $this->product->update(['price' => 12500.00]);

        $otherProduct = Product::factory()->create([
            'supplier_id' => $this->supplierProfile->id,
            'category' => 'Ubi',
            'price' => 10000.00,
        ]);

        Order::create([
            'order_code' => 'ORD-2026-55552',
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $otherProduct->id,
            'quantity' => 10,
            'unit_price' => 10000.00,
            'total_price' => 100000.00,
            'type' => 'single',
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);

        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson("/api/ai/price-analysis/{$this->product->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'yellow')
            ->assertJsonPath('data.difference_percentage', 25)
            ->assertJsonPath('data.summary', 'Harga berada di atas rata-rata pasar (dalam batas 30%).');
    }

    /**
     * Test red status mapping (> 30% above average):
     * Current price = 16500, Market Average = 10000 -> Diff percent = 65% -> status red.
     */
    public function test_red_status_price_anomaly(): void
    {
        $this->product->update(['price' => 16500.00]);

        $otherProduct = Product::factory()->create([
            'supplier_id' => $this->supplierProfile->id,
            'category' => 'Ubi',
            'price' => 10000.00,
        ]);

        Order::create([
            'order_code' => 'ORD-2026-55553',
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $otherProduct->id,
            'quantity' => 10,
            'unit_price' => 10000.00,
            'total_price' => 100000.00,
            'type' => 'single',
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);

        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson("/api/ai/price-analysis/{$this->product->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'red')
            ->assertJsonPath('data.difference_percentage', 65)
            ->assertJsonPath('data.summary', 'Harga berada jauh di atas rata-rata pasar. Evaluasi diperlukan.');
    }

    /**
     * Test 404 response for invalid product IDs.
     */
    public function test_returns_404_when_product_not_found(): void
    {
        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson('/api/ai/price-analysis/99999');

        $response->assertStatus(404)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Produk tidak ditemukan.');
    }
}

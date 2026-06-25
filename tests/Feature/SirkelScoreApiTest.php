<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\SupplierProfile;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SirkelScoreApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $umkmUser;
    protected User $supplierUser;
    protected User $otherSupplierUser;
    protected User $adminUser;
    protected SupplierProfile $supplierProfile;
    protected SupplierProfile $otherSupplierProfile;
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
            'business_type' => 'Jasa',
            'business_address' => 'Surabaya',
            'district_city' => 'Surabaya',
            'raw_material_category' => 'Kertas',
            'monthly_need_estimate' => 100,
        ]);

        // Create Admin
        $this->adminUser = User::factory()->create(['role' => 'admin']);
        $this->adminUser->assignRole('admin');

        // Create Suppliers
        $this->supplierUser = User::factory()->create(['role' => 'supplier']);
        $this->supplierUser->assignRole('supplier');
        $this->supplierProfile = SupplierProfile::factory()->create([
            'user_id' => $this->supplierUser->id,
            'rating' => 0.00,
            'sirkel_score' => 0.00,
        ]);

        $this->otherSupplierUser = User::factory()->create(['role' => 'supplier']);
        $this->otherSupplierUser->assignRole('supplier');
        $this->otherSupplierProfile = SupplierProfile::factory()->create([
            'user_id' => $this->otherSupplierUser->id,
            'rating' => 0.00,
            'sirkel_score' => 0.00,
        ]);

        // Create Product
        $this->product = Product::factory()->create([
            'supplier_id' => $this->supplierProfile->id,
            'stock' => 10,
        ]);
    }

    /**
     * Test sirkel-score retrieval and breakdown.
     */
    public function test_can_retrieve_sirkel_score_breakdown(): void
    {
        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson("/api/suppliers/{$this->supplierProfile->id}/sirkel-score");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success', 'message', 'data' => [
                    'sirkel_score', 'badge', 'rank', 'total_suppliers',
                    'review_score', 'completion_score', 'delivery_score', 'activity_score'
                ]
            ]);
    }

    /**
     * Test sorting suppliers by sirkel score.
     */
    public function test_can_sort_suppliers_by_sirkel_score(): void
    {
        // Set distinct scores
        $this->supplierProfile->update(['sirkel_score' => 95.00]);
        $this->otherSupplierProfile->update(['sirkel_score' => 60.00]);

        // 1. Sort by highest score (descending)
        $responseDesc = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson('/api/suppliers?sort_by=highest_score');

        $responseDesc->assertStatus(200)
            ->assertJsonPath('data.0.id', $this->supplierProfile->id)
            ->assertJsonPath('data.1.id', $this->otherSupplierProfile->id);

        // 2. Sort by lowest score (ascending)
        $responseAsc = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson('/api/suppliers?sort_by=lowest_score');

        $responseAsc->assertStatus(200)
            ->assertJsonPath('data.0.id', $this->otherSupplierProfile->id)
            ->assertJsonPath('data.1.id', $this->supplierProfile->id);
    }

    /**
     * Test administrative recalculate endpoint.
     */
    public function test_only_admin_can_trigger_recalculation(): void
    {
        // Fail: UMKM user tries to recalculate
        $responseUmkm = $this->actingAs($this->umkmUser, 'sanctum')
            ->postJson('/api/admin/recalculate-sirkel-score');
        $responseUmkm->assertStatus(403);

        // Success: Admin tries to recalculate
        $responseAdmin = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/admin/recalculate-sirkel-score');
        $responseAdmin->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    /**
     * Test dynamic score update when a review is created.
     */
    public function test_creating_review_updates_sirkel_score_reactively(): void
    {
        $order = Order::create([
            'order_code' => 'ORD-2026-99991',
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $this->product->id,
            'quantity' => 5,
            'unit_price' => 5000.00,
            'total_price' => 25000.00,
            'type' => 'single',
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);

        // Assert initial score is low (rating = 0.0)
        $this->supplierProfile->refresh();
        $initialScore = $this->supplierProfile->sirkel_score;

        // Submit review of 5 stars
        $this->actingAs($this->umkmUser, 'sanctum')
            ->postJson('/api/reviews', [
                'order_id' => $order->id,
                'rating' => 5,
                'comment' => 'Kualitas produk sangat terjamin sekali.',
            ])
            ->assertStatus(201);

        $this->supplierProfile->refresh();
        $newScore = $this->supplierProfile->sirkel_score;

        $this->assertTrue($newScore > $initialScore);
    }

    /**
     * Test dynamic score update when product updated.
     */
    public function test_updating_product_updates_sirkel_score_reactively(): void
    {
        $this->supplierProfile->refresh();
        $initialScore = $this->supplierProfile->sirkel_score;

        // Update product stock to 0 to trigger observer and change score
        $this->product->update(['stock' => 0]);

        $this->supplierProfile->refresh();
        $newScore = $this->supplierProfile->sirkel_score;

        // Score should change because product activity is recalculated
        $this->assertNotEquals($initialScore, $newScore);
    }
}

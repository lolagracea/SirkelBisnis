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

class ReviewApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $umkmUser;
    protected User $otherUmkmUser;
    protected User $supplierUser;
    protected User $adminUser;
    protected Product $product;
    protected SupplierProfile $supplierProfile;
    protected Order $completedOrder;
    protected Order $pendingOrder;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles & permissions
        $this->seed(RolePermissionSeeder::class);

        // Create UMKM users
        $this->umkmUser = User::factory()->create(['role' => 'umkm']);
        $this->umkmUser->assignRole('umkm');
        $this->umkmUser->umkmProfile()->create([
            'business_name' => 'UMKM Foodie',
            'business_type' => 'Kuliner',
            'business_address' => 'Jakarta',
            'district_city' => 'Jakarta',
            'raw_material_category' => 'Bahan Pangan',
            'monthly_need_estimate' => 200,
        ]);

        $this->otherUmkmUser = User::factory()->create(['role' => 'umkm']);
        $this->otherUmkmUser->assignRole('umkm');
        $this->otherUmkmUser->umkmProfile()->create([
            'business_name' => 'UMKM Clothes',
            'business_type' => 'Konveksi',
            'business_address' => 'Bandung',
            'district_city' => 'Bandung',
            'raw_material_category' => 'Kain',
            'monthly_need_estimate' => 100,
        ]);

        // Create Supplier
        $this->supplierUser = User::factory()->create(['role' => 'supplier']);
        $this->supplierUser->assignRole('supplier');
        $this->supplierProfile = SupplierProfile::factory()->create([
            'user_id' => $this->supplierUser->id,
            'rating' => 0.00,
        ]);

        // Create Admin
        $this->adminUser = User::factory()->create(['role' => 'admin']);
        $this->adminUser->assignRole('admin');

        // Create Product
        $this->product = Product::factory()->create([
            'supplier_id' => $this->supplierProfile->id,
        ]);

        // Create Completed and Pending Orders
        $this->completedOrder = Order::create([
            'order_code' => 'ORD-2026-00001',
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $this->product->id,
            'quantity' => 10,
            'unit_price' => 10000.00,
            'total_price' => 100000.00,
            'type' => 'single',
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);

        $this->pendingOrder = Order::create([
            'order_code' => 'ORD-2026-00002',
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $this->product->id,
            'quantity' => 10,
            'unit_price' => 10000.00,
            'total_price' => 100000.00,
            'type' => 'single',
            'status' => 'pending',
            'payment_status' => 'unpaid',
        ]);
    }

    /**
     * Test reviews index.
     */
    public function test_can_list_all_reviews_paginated(): void
    {
        Review::factory()->create([
            'order_id' => $this->completedOrder->id,
            'supplier_id' => $this->supplierProfile->id,
            'user_id' => $this->umkmUser->id,
        ]);

        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson('/api/reviews');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success', 'message', 'data', 'links', 'meta'
            ]);
    }

    /**
     * Test review details.
     */
    public function test_can_show_review_details(): void
    {
        $review = Review::factory()->create([
            'order_id' => $this->completedOrder->id,
            'supplier_id' => $this->supplierProfile->id,
            'user_id' => $this->umkmUser->id,
        ]);

        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson("/api/reviews/{$review->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $review->id)
            ->assertJsonStructure([
                'data' => [
                    'id', 'order_id', 'supplier_id', 'user_id', 'rating', 'comment',
                    'created_at', 'updated_at', 'order', 'user', 'supplier'
                ]
            ]);
    }

    /**
     * Test UMKM can submit a review on a completed order.
     */
    public function test_umkm_user_can_submit_review_on_completed_order(): void
    {
        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->postJson('/api/reviews', [
                'order_id' => $this->completedOrder->id,
                'rating' => 5,
                'comment' => 'Kualitas barang sangat premium dan memuaskan.',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.rating', 5)
            ->assertJsonPath('data.comment', 'Kualitas barang sangat premium dan memuaskan.');

        $this->assertDatabaseHas('reviews', [
            'order_id' => $this->completedOrder->id,
            'user_id' => $this->umkmUser->id,
            'rating' => 5,
        ]);

        // Verify supplier rating updated
        $this->assertDatabaseHas('supplier_profiles', [
            'id' => $this->supplierProfile->id,
            'rating' => 5.00,
        ]);
    }

    /**
     * Test validation fails for non-completed order.
     */
    public function test_cannot_review_non_completed_orders(): void
    {
        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->postJson('/api/reviews', [
                'order_id' => $this->pendingOrder->id,
                'rating' => 5,
                'comment' => 'Pengiriman lambat sekali.',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    /**
     * Test validation rules (e.g. comment too short).
     */
    public function test_review_validation_rules(): void
    {
        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->postJson('/api/reviews', [
                'order_id' => $this->completedOrder->id,
                'rating' => 6, // must be between 1 and 5
                'comment' => 'Jelek', // too short (< 10 chars)
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rating', 'comment']);
    }

    /**
     * Test cannot review other user's order.
     */
    public function test_cannot_review_another_users_order(): void
    {
        $response = $this->actingAs($this->otherUmkmUser, 'sanctum')
            ->postJson('/api/reviews', [
                'order_id' => $this->completedOrder->id,
                'rating' => 5,
                'comment' => 'Produk sangat memuaskan sekali.',
            ]);

        $response->assertStatus(403);
    }

    /**
     * Test only one review allowed per order.
     */
    public function test_cannot_review_same_order_twice(): void
    {
        Review::factory()->create([
            'order_id' => $this->completedOrder->id,
            'supplier_id' => $this->supplierProfile->id,
            'user_id' => $this->umkmUser->id,
        ]);

        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->postJson('/api/reviews', [
                'order_id' => $this->completedOrder->id,
                'rating' => 4,
                'comment' => 'Komentar kedua yang dilarang.',
            ]);

        $response->assertStatus(422);
    }

    /**
     * Test update review permissions and recalculation logic.
     */
    public function test_only_review_owner_can_update_review(): void
    {
        $review = Review::factory()->create([
            'order_id' => $this->completedOrder->id,
            'supplier_id' => $this->supplierProfile->id,
            'user_id' => $this->umkmUser->id,
            'rating' => 3,
        ]);

        // Supplier profile rating is updated to 3.00
        $this->supplierProfile->update(['rating' => 3.00]);

        // Fail: Other UMKM updates review
        $this->actingAs($this->otherUmkmUser, 'sanctum')
            ->putJson("/api/reviews/{$review->id}", [
                'rating' => 5,
                'comment' => 'Komentar baru yang panjang dan valid.',
            ])
            ->assertStatus(403);

        // Success: Owner updates review to 5 stars
        $this->actingAs($this->umkmUser, 'sanctum')
            ->putJson("/api/reviews/{$review->id}", [
                'rating' => 5,
                'comment' => 'Komentar baru yang panjang dan valid.',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.rating', 5);

        // Verify supplier rating updated to 5.00
        $this->assertDatabaseHas('supplier_profiles', [
            'id' => $this->supplierProfile->id,
            'rating' => 5.00,
        ]);
    }

    /**
     * Test delete review authorization and recalculation logic.
     */
    public function test_only_owner_or_admin_can_delete_review(): void
    {
        $review = Review::factory()->create([
            'order_id' => $this->completedOrder->id,
            'supplier_id' => $this->supplierProfile->id,
            'user_id' => $this->umkmUser->id,
            'rating' => 5,
        ]);

        $this->supplierProfile->update(['rating' => 5.00]);

        // Fail: Other UMKM deletes
        $this->actingAs($this->otherUmkmUser, 'sanctum')
            ->deleteJson("/api/reviews/{$review->id}")
            ->assertStatus(403);

        // Success: Admin deletes review
        $this->actingAs($this->adminUser, 'sanctum')
            ->deleteJson("/api/reviews/{$review->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('reviews', [
            'id' => $review->id,
        ]);

        // Verify supplier rating recalculated to 0.00 since no reviews left
        $this->assertDatabaseHas('supplier_profiles', [
            'id' => $this->supplierProfile->id,
            'rating' => 0.00,
        ]);
    }

    /**
     * Test my-reviews listing.
     */
    public function test_umkm_can_list_own_submitted_reviews(): void
    {
        Review::factory()->create([
            'order_id' => $this->completedOrder->id,
            'supplier_id' => $this->supplierProfile->id,
            'user_id' => $this->umkmUser->id,
        ]);

        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson('/api/my-reviews');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    /**
     * Test supplier-reviews listing.
     */
    public function test_can_list_reviews_received_by_supplier(): void
    {
        Review::factory()->create([
            'order_id' => $this->completedOrder->id,
            'supplier_id' => $this->supplierProfile->id,
            'user_id' => $this->umkmUser->id,
        ]);

        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson("/api/suppliers/{$this->supplierProfile->id}/reviews");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }
}

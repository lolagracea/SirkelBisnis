<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\ReviewSummary;
use App\Models\SupplierProfile;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AIReviewSummaryApiTest extends TestCase
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
            'business_type' => 'Jasa',
            'business_address' => 'Surabaya',
            'district_city' => 'Surabaya',
            'raw_material_category' => 'Kertas',
            'monthly_need_estimate' => 100,
        ]);

        // Create Supplier
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
            'stock' => 10,
        ]);
    }

    /**
     * Test route is protected and rejects unauthenticated requests.
     */
    public function test_route_requires_authentication(): void
    {
        $response = $this->getJson("/api/ai/review-summary/{$this->supplierProfile->id}");
        $response->assertStatus(401);
    }

    /**
     * Test when supplier has no reviews.
     */
    public function test_empty_reviews_returns_graceful_response_without_calling_gemini(): void
    {
        Http::fake();

        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson("/api/ai/review-summary/{$this->supplierProfile->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Belum ada review untuk supplier ini.')
            ->assertJsonPath('data.positive', [])
            ->assertJsonPath('data.negative', [])
            ->assertJsonPath('data.summary', 'Belum ada review untuk supplier ini.');

        // Assert Gemini API was never called
        Http::assertNothingSent();
    }

    /**
     * Test generating summary successfully when reviews exist and cache is empty.
     */
    public function test_generates_and_saves_review_summary_successfully(): void
    {
        // 1. Setup a completed order and a review
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

        Review::create([
            'order_id' => $order->id,
            'supplier_id' => $this->supplierProfile->id,
            'user_id' => $this->umkmUser->id,
            'rating' => 5,
            'comment' => 'Produk sangat bagus dan kualitas konsisten',
        ]);

        // 2. Fake Gemini response
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'positive' => ['Kualitas produk konsisten', 'Harga kompetitif'],
                                        'negative' => ['Pengiriman terkadang terlambat'],
                                        'summary' => 'Supplier memiliki kualitas produk yang baik dengan harga kompetitif.'
                                    ])
                                ]
                            ]
                        ]
                    ]
                ]
            ], 200)
        ]);

        // 3. Make the API call
        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson("/api/ai/review-summary/{$this->supplierProfile->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'AI Review summary generated successfully.')
            ->assertJsonPath('data.positive', ['Kualitas produk konsisten', 'Harga kompetitif'])
            ->assertJsonPath('data.negative', ['Pengiriman terkadang terlambat'])
            ->assertJsonPath('data.summary', 'Supplier memiliki kualitas produk yang baik dengan harga kompetitif.');

        // 4. Verify saved in DB
        $this->assertDatabaseHas('review_summaries', [
            'supplier_id' => $this->supplierProfile->id,
            'summary' => 'Supplier memiliki kualitas produk yang baik dengan harga kompetitif.',
        ]);

        Http::assertSentCount(1);
    }

    /**
     * Test serving summary from cache when reviews haven't changed.
     */
    public function test_serves_summary_from_cache_without_calling_gemini(): void
    {
        // 1. Setup completed order and review
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

        Review::create([
            'order_id' => $order->id,
            'supplier_id' => $this->supplierProfile->id,
            'user_id' => $this->umkmUser->id,
            'rating' => 5,
            'comment' => 'Produk sangat bagus dan kualitas konsisten',
        ]);

        // 2. Pre-create cached summary in the database
        ReviewSummary::create([
            'supplier_id' => $this->supplierProfile->id,
            'positive_points' => ['Kualitas produk konsisten'],
            'negative_points' => ['Pengiriman terlambat'],
            'summary' => 'Ringkasan tersimpan di cache.',
        ]);

        // 3. Fake Gemini (should not be called)
        Http::fake();

        // 4. Call API
        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson("/api/ai/review-summary/{$this->supplierProfile->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'AI Review summary retrieved from cache.')
            ->assertJsonPath('data.summary', 'Ringkasan tersimpan di cache.');

        Http::assertNothingSent();
    }

    /**
     * Test cache is invalidated and regenerated when a new review is added.
     */
    public function test_cache_is_invalidated_when_new_review_added(): void
    {
        // 1. First order and review
        $order1 = Order::create([
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

        Review::create([
            'order_id' => $order1->id,
            'supplier_id' => $this->supplierProfile->id,
            'user_id' => $this->umkmUser->id,
            'rating' => 5,
            'comment' => 'Review pertama',
        ]);

        // 2. Pre-create old summary (updated in the past)
        $summary = ReviewSummary::create([
            'supplier_id' => $this->supplierProfile->id,
            'positive_points' => ['Review pertama'],
            'negative_points' => [],
            'summary' => 'Ringkasan lama.',
        ]);

        // Manually update the updated_at timestamp of the summary to the past using query builder
        \Illuminate\Support\Facades\DB::table('review_summaries')
            ->where('id', $summary->id)
            ->update(['updated_at' => now()->subMinutes(10)]);


        // 3. Create a second review (newer timestamp than the cached summary)
        $order2 = Order::create([
            'order_code' => 'ORD-2026-99992',
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $this->product->id,
            'quantity' => 10,
            'unit_price' => 5000.00,
            'total_price' => 50000.00,
            'type' => 'single',
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);

        Review::create([
            'order_id' => $order2->id,
            'supplier_id' => $this->supplierProfile->id,
            'user_id' => $this->umkmUser->id,
            'rating' => 4,
            'comment' => 'Review kedua yang baru saja ditambahkan',
        ]);

        // 4. Fake Gemini response for the update
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'positive' => ['Review pertama', 'Review kedua'],
                                        'negative' => [],
                                        'summary' => 'Ringkasan baru setelah invalidasi.'
                                    ])
                                ]
                            ]
                        ]
                    ]
                ]
            ], 200)
        ]);

        // 5. Call API
        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson("/api/ai/review-summary/{$this->supplierProfile->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'AI Review summary generated successfully.')
            ->assertJsonPath('data.summary', 'Ringkasan baru setelah invalidasi.');

        Http::assertSentCount(1);
    }

    /**
     * Test 404 response when supplier ID does not exist.
     */
    public function test_returns_404_when_supplier_not_found(): void
    {
        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson('/api/ai/review-summary/99999');

        $response->assertStatus(404)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Supplier tidak ditemukan.');
    }
}

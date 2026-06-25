<?php

namespace Tests\Feature;

use App\Models\BusinessInsight;
use App\Models\Order;
use App\Models\Product;
use App\Models\SupplierProfile;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BusinessInsightApiTest extends TestCase
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
        $response = $this->getJson('/api/ai/business-insight');
        $response->assertStatus(401);
    }

    /**
     * Test route rejects non-UMKM users.
     */
    public function test_route_rejects_non_umkm_users(): void
    {
        $response = $this->actingAs($this->supplierUser, 'sanctum')
            ->getJson('/api/ai/business-insight');

        $response->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Hanya pengguna dengan peran UMKM yang dapat mengakses wawasan bisnis.');
    }

    /**
     * Test generating insight successfully when cache is empty.
     */
    public function test_generates_and_saves_business_insight_successfully(): void
    {
        // 1. Setup a completed order to feed data
        Order::create([
            'order_code' => 'ORD-2026-88881',
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $this->product->id,
            'quantity' => 20,
            'unit_price' => 2000.00,
            'total_price' => 40000.00,
            'type' => 'single',
            'status' => 'completed',
            'payment_status' => 'paid',
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
                                        'business_condition' => 'Permintaan singkong meningkat dalam 2 minggu terakhir.',
                                        'saving_opportunity' => 'Bergabung dengan patungan aktif dapat menghemat hingga 15%.',
                                        'group_buying_recommendation' => 'Terdapat 2 patungan aktif yang relevan.',
                                        'restock_recommendation' => 'Disarankan restock dalam 5 hari.',
                                        'business_advice' => 'Pertimbangkan pembelian dalam jumlah lebih besar untuk mendapatkan harga grosir.'
                                    ])
                                ]
                            ]
                        ]
                    ]
                ]
            ], 200)
        ]);

        // 3. Make API call
        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson('/api/ai/business-insight');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Wawasan bisnis berhasil dibuat menggunakan AI.')
            ->assertJsonPath('data.business_condition', 'Permintaan singkong meningkat dalam 2 minggu terakhir.')
            ->assertJsonPath('data.saving_opportunity', 'Bergabung dengan patungan aktif dapat menghemat hingga 15%.')
            ->assertJsonPath('data.business_advice', 'Pertimbangkan pembelian dalam jumlah lebih besar untuk mendapatkan harga grosir.');

        // 4. Verify saved in DB
        $this->assertDatabaseHas('business_insights', [
            'user_id' => $this->umkmUser->id,
            'business_condition' => 'Permintaan singkong meningkat dalam 2 minggu terakhir.',
        ]);

        Http::assertSentCount(1);
    }

    /**
     * Test serving business insight from cache when no new activity has occurred.
     */
    public function test_serves_business_insight_from_cache_without_calling_gemini(): void
    {
        // 1. Setup a completed order
        Order::create([
            'order_code' => 'ORD-2026-88881',
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $this->product->id,
            'quantity' => 20,
            'unit_price' => 2000.00,
            'total_price' => 40000.00,
            'type' => 'single',
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);

        // 2. Pre-create cached insight
        BusinessInsight::create([
            'user_id' => $this->umkmUser->id,
            'business_condition' => 'Kondisi stabil.',
            'saving_opportunity' => 'Tidak ada peluang baru.',
            'group_buying_recommendation' => 'Tidak ada.',
            'restock_recommendation' => 'Belum perlu.',
            'business_advice' => 'Lanjutkan bisnis seperti biasa.',
        ]);

        // 3. Fake Gemini (should NOT be called)
        Http::fake();

        // 4. Call API
        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson('/api/ai/business-insight');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Wawasan bisnis berhasil dimuat dari cache.')
            ->assertJsonPath('data.business_condition', 'Kondisi stabil.');

        Http::assertNothingSent();
    }

    /**
     * Test cache is invalidated and regenerated when a new order is completed/added.
     */
    public function test_cache_is_invalidated_when_new_order_added(): void
    {
        // 1. First order
        $order1 = Order::create([
            'order_code' => 'ORD-2026-88881',
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $this->product->id,
            'quantity' => 10,
            'unit_price' => 2000.00,
            'total_price' => 20000.00,
            'type' => 'single',
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);

        // 2. Pre-create old insight
        $insight = BusinessInsight::create([
            'user_id' => $this->umkmUser->id,
            'business_condition' => 'Kondisi lama.',
            'saving_opportunity' => 'Hemat lama.',
            'group_buying_recommendation' => 'Rekomendasi lama.',
            'restock_recommendation' => 'Restock lama.',
            'business_advice' => 'Saran lama.',
        ]);

        // Manually update updated_at of the insight to the past
        \Illuminate\Support\Facades\DB::table('business_insights')
            ->where('id', $insight->id)
            ->update(['updated_at' => now()->subMinutes(10)]);

        // 3. Create a second order (newer activity timestamp)
        Order::create([
            'order_code' => 'ORD-2026-88882',
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $this->product->id,
            'quantity' => 30,
            'unit_price' => 2000.00,
            'total_price' => 60000.00,
            'type' => 'single',
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);

        // 4. Fake Gemini response for invalidation update
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'business_condition' => 'Kondisi baru setelah order tambahan.',
                                        'saving_opportunity' => 'Peluang hemat baru.',
                                        'group_buying_recommendation' => 'Rekomendasi baru.',
                                        'restock_recommendation' => 'Restock baru.',
                                        'business_advice' => 'Saran baru.'
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
            ->getJson('/api/ai/business-insight');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Wawasan bisnis berhasil dibuat menggunakan AI.')
            ->assertJsonPath('data.business_condition', 'Kondisi baru setelah order tambahan.');

        Http::assertSentCount(1);
    }
}

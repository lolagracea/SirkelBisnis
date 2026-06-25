<?php

namespace Tests\Feature;

use App\Models\GroupBuying;
use App\Models\Product;
use App\Models\SupplierProfile;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GroupBuyingMatchingApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $umkmUser;
    protected User $supplierUser;
    protected SupplierProfile $supplierProfileMatch;
    protected SupplierProfile $supplierProfileFar;
    protected SupplierProfile $supplierProfileCategoryMismatch;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles & permissions
        $this->seed(RolePermissionSeeder::class);

        // Create UMKM user (raw_material_category = Tepung)
        $this->umkmUser = User::factory()->create(['role' => 'umkm']);
        $this->umkmUser->assignRole('umkm');
        $this->umkmUser->umkmProfile()->create([
            'business_name' => 'Sirkel UMKM',
            'business_type' => 'Makanan',
            'business_address' => 'Surabaya',
            'district_city' => 'Surabaya',
            'raw_material_category' => 'Tepung',
            'monthly_need_estimate' => 300,
        ]);

        // Create Supplier users
        $this->supplierUser = User::factory()->create(['role' => 'supplier']);
        $this->supplierUser->assignRole('supplier');

        // Supplier 1: Matches category, is near (approx 1.5 km away)
        $this->supplierProfileMatch = SupplierProfile::factory()->create([
            'user_id' => $this->supplierUser->id,
            'latitude' => -7.2604,
            'longitude' => 112.7608,
            'rating' => 4.5,
        ]);

        // Supplier 2: Matches category, but far away (approx 39 km away)
        $this->supplierProfileFar = SupplierProfile::factory()->create([
            'user_id' => User::factory()->create(['role' => 'supplier'])->id,
            'latitude' => -7.5504,
            'longitude' => 112.9508,
            'rating' => 4.0,
        ]);

        // Supplier 3: Mismatched category (Kertas), is near
        $this->supplierProfileCategoryMismatch = SupplierProfile::factory()->create([
            'user_id' => User::factory()->create(['role' => 'supplier'])->id,
            'latitude' => -7.2554,
            'longitude' => 112.7558,
            'rating' => 5.0,
        ]);
    }

    /**
     * Test route is protected and rejects unauthenticated requests.
     */
    public function test_route_requires_authentication(): void
    {
        $response = $this->getJson('/api/ai/group-buying-match');
        $response->assertStatus(401);
    }

    /**
     * Test route rejects non-UMKM users.
     */
    public function test_route_rejects_non_umkm_users(): void
    {
        $response = $this->actingAs($this->supplierUser, 'sanctum')
            ->getJson('/api/ai/group-buying-match');

        $response->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Hanya pengguna dengan peran UMKM yang dapat mengakses pencocokan patungan.');
    }

    /**
     * Test finding matches with correct filters.
     */
    public function test_matches_and_filters_open_campaigns_correctly(): void
    {
        // 1. Create open campaign for matched supplier (category: Tepung, near)
        $productMatch = Product::factory()->create([
            'supplier_id' => $this->supplierProfileMatch->id,
            'category' => 'Tepung',
        ]);
        $campaignMatch = GroupBuying::create([
            'product_id' => $productMatch->id,
            'creator_id' => $this->supplierProfileMatch->user_id,
            'target_quantity' => 100,
            'current_quantity' => 80,
            'min_participants' => 5,
            'deadline' => now()->addDays(5)->toDateString(),
            'status' => 'open',
        ]);

        // 2. Create open campaign for far supplier (category: Tepung, far)
        $productFar = Product::factory()->create([
            'supplier_id' => $this->supplierProfileFar->id,
            'category' => 'Tepung',
        ]);
        GroupBuying::create([
            'product_id' => $productFar->id,
            'creator_id' => $this->supplierProfileFar->user_id,
            'target_quantity' => 100,
            'current_quantity' => 50,
            'min_participants' => 5,
            'deadline' => now()->addDays(5)->toDateString(),
            'status' => 'open',
        ]);

        // 3. Create open campaign for mismatched category supplier (category: Kertas, near)
        $productMismatch = Product::factory()->create([
            'supplier_id' => $this->supplierProfileCategoryMismatch->id,
            'category' => 'Kertas',
        ]);
        GroupBuying::create([
            'product_id' => $productMismatch->id,
            'creator_id' => $this->supplierProfileCategoryMismatch->user_id,
            'target_quantity' => 100,
            'current_quantity' => 40,
            'min_participants' => 5,
            'deadline' => now()->addDays(5)->toDateString(),
            'status' => 'open',
        ]);

        // 4. Invoke API using user's coordinate (-7.2504, 112.7508)
        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson('/api/ai/group-buying-match?latitude=-7.2504&longitude=112.7508');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Group buying matches found successfully.')
            ->assertJsonCount(1, 'data') // Excludes far supplier and category mismatch supplier
            ->assertJsonPath('data.0.group_buying_id', $campaignMatch->id)
            ->assertJsonStructure([
                'success', 'message', 'data' => [
                    '*' => ['group_buying_id', 'match_score', 'saving_percentage', 'distance']
                ]
            ]);
    }
}

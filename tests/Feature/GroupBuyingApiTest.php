<?php

namespace Tests\Feature;

use App\Models\GroupBuying;
use App\Models\GroupBuyingMember;
use App\Models\Product;
use App\Models\SupplierProfile;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class GroupBuyingApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $umkmUser;
    protected User $otherUmkmUser;
    protected User $supplierUser;
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
            'business_name' => 'UMKM Mart',
            'business_type' => 'Kuliner',
            'business_address' => 'Jakarta',
            'district_city' => 'Jakarta',
            'raw_material_category' => 'Bahan Pangan',
            'monthly_need_estimate' => 500,
        ]);

        // Create another UMKM user
        $this->otherUmkmUser = User::factory()->create(['role' => 'umkm']);
        $this->otherUmkmUser->assignRole('umkm');
        $this->otherUmkmUser->umkmProfile()->create([
            'business_name' => 'UMKM Jaya',
            'business_type' => 'Konveksi',
            'business_address' => 'Bandung',
            'district_city' => 'Bandung',
            'raw_material_category' => 'Kain',
            'monthly_need_estimate' => 300,
        ]);

        // Create Supplier user and Profile
        $this->supplierUser = User::factory()->create(['role' => 'supplier']);
        $this->supplierUser->assignRole('supplier');
        $supplierProfile = SupplierProfile::factory()->create([
            'user_id' => $this->supplierUser->id,
        ]);

        // Create Product
        $this->product = Product::factory()->create([
            'supplier_id' => $supplierProfile->id,
            'price' => 10000.00,
        ]);
    }

    /**
     * Test active group buyings listing.
     */
    public function test_can_list_active_group_buyings(): void
    {
        // Create an open, a completed, and a cancelled group buying
        GroupBuying::factory()->create([
            'product_id' => $this->product->id,
            'creator_id' => $this->umkmUser->id,
            'status' => 'open',
            'deadline' => Carbon::tomorrow(),
        ]);

        GroupBuying::factory()->create([
            'product_id' => $this->product->id,
            'creator_id' => $this->umkmUser->id,
            'status' => 'completed',
            'deadline' => Carbon::tomorrow(),
        ]);

        GroupBuying::factory()->create([
            'product_id' => $this->product->id,
            'creator_id' => $this->umkmUser->id,
            'status' => 'cancelled',
            'deadline' => Carbon::tomorrow(),
        ]);

        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson('/api/group-buyings');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data'); // Only active (open) group buying
    }

    /**
     * Test showing detailed group buying information.
     */
    public function test_can_show_group_buying_details(): void
    {
        $groupBuying = GroupBuying::factory()->create([
            'product_id' => $this->product->id,
            'creator_id' => $this->umkmUser->id,
            'status' => 'open',
            'deadline' => Carbon::tomorrow(),
        ]);

        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson("/api/group-buyings/{$groupBuying->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $groupBuying->id)
            ->assertJsonStructure([
                'data' => [
                    'id', 'product_id', 'creator_id', 'target_quantity', 'current_quantity',
                    'min_participants', 'deadline', 'status', 'progress_percentage',
                    'participant_count', 'days_remaining', 'eligible_for_fulfillment',
                    'product', 'creator', 'members'
                ]
            ]);
    }

    /**
     * Test only UMKM users can create group buying.
     */
    public function test_only_umkm_can_create_group_buying(): void
    {
        $payload = [
            'product_id' => $this->product->id,
            'target_quantity' => 500,
            'min_participants' => 5,
            'deadline' => Carbon::tomorrow()->format('Y-m-d'),
        ];

        // Fail: Supplier user attempts to create
        $responseSupplier = $this->actingAs($this->supplierUser, 'sanctum')
            ->postJson('/api/group-buyings', $payload);

        $responseSupplier->assertStatus(403); // Spatie role middleware block

        // Success: UMKM user attempts to create
        $responseUmkm = $this->actingAs($this->umkmUser, 'sanctum')
            ->postJson('/api/group-buyings', $payload);

        $responseUmkm->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.target_quantity', 500)
            ->assertJsonPath('data.status', 'open');

        $this->assertDatabaseHas('group_buyings', [
            'creator_id' => $this->umkmUser->id,
            'product_id' => $this->product->id,
            'target_quantity' => 500,
        ]);
    }

    /**
     * Test request validation for creating a group buying.
     */
    public function test_group_buying_creation_validation(): void
    {
        $payload = [
            'product_id' => 999999, // non-existent product
            'target_quantity' => 0,  // must be > 0
            'min_participants' => 1, // must be > 1
            'deadline' => Carbon::yesterday()->format('Y-m-d'), // must be future date
        ];

        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->postJson('/api/group-buyings', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['product_id', 'target_quantity', 'min_participants', 'deadline']);
    }

    /**
     * Test joining a group buying.
     */
    public function test_umkm_user_can_join_group_buying(): void
    {
        $groupBuying = GroupBuying::factory()->create([
            'product_id' => $this->product->id,
            'creator_id' => $this->umkmUser->id,
            'target_quantity' => 500,
            'current_quantity' => 100,
            'min_participants' => 3,
            'deadline' => Carbon::tomorrow(),
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->otherUmkmUser, 'sanctum')
            ->postJson("/api/group-buyings/{$groupBuying->id}/join", [
                'quantity' => 50,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.quantity', 50)
            ->assertJsonPath('data.amount', 500000); // 50 * 10000.00

        $this->assertDatabaseHas('group_buying_members', [
            'group_buying_id' => $groupBuying->id,
            'user_id' => $this->otherUmkmUser->id,
            'quantity' => 50,
            'amount' => 500000.00,
        ]);

        $this->assertDatabaseHas('group_buyings', [
            'id' => $groupBuying->id,
            'current_quantity' => 150, // 100 + 50
        ]);
    }

    /**
     * Test cannot join twice.
     */
    public function test_user_cannot_join_group_buying_twice(): void
    {
        $groupBuying = GroupBuying::factory()->create([
            'product_id' => $this->product->id,
            'creator_id' => $this->umkmUser->id,
            'target_quantity' => 500,
            'current_quantity' => 0,
            'min_participants' => 3,
            'deadline' => Carbon::tomorrow(),
            'status' => 'open',
        ]);

        // Join once
        GroupBuyingMember::create([
            'group_buying_id' => $groupBuying->id,
            'user_id' => $this->otherUmkmUser->id,
            'quantity' => 50,
            'amount' => 500000.00,
        ]);

        // Try to join again
        $response = $this->actingAs($this->otherUmkmUser, 'sanctum')
            ->postJson("/api/group-buyings/{$groupBuying->id}/join", [
                'quantity' => 50,
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Validation error.');
    }

    /**
     * Test cannot join inactive group buying.
     */
    public function test_cannot_join_completed_expired_or_cancelled_group_buying(): void
    {
        $completedGroup = GroupBuying::factory()->create([
            'product_id' => $this->product->id,
            'creator_id' => $this->umkmUser->id,
            'status' => 'completed',
            'deadline' => Carbon::tomorrow(),
        ]);

        $response = $this->actingAs($this->otherUmkmUser, 'sanctum')
            ->postJson("/api/group-buyings/{$completedGroup->id}/join", [
                'quantity' => 50,
            ]);

        $response->assertStatus(422);
    }

    /**
     * Test auto completed state when target quantity is met.
     */
    public function test_group_buying_status_automatically_completes_when_target_quantity_reached(): void
    {
        $groupBuying = GroupBuying::factory()->create([
            'product_id' => $this->product->id,
            'creator_id' => $this->umkmUser->id,
            'target_quantity' => 100,
            'current_quantity' => 80,
            'min_participants' => 2,
            'deadline' => Carbon::tomorrow(),
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->otherUmkmUser, 'sanctum')
            ->postJson("/api/group-buyings/{$groupBuying->id}/join", [
                'quantity' => 20,
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('group_buyings', [
            'id' => $groupBuying->id,
            'current_quantity' => 100,
            'status' => 'completed',
        ]);
    }

    /**
     * Test cancellation of group buying by its creator.
     */
    public function test_only_creator_can_cancel_group_buying(): void
    {
        $groupBuying = GroupBuying::factory()->create([
            'product_id' => $this->product->id,
            'creator_id' => $this->umkmUser->id,
            'status' => 'open',
            'deadline' => Carbon::tomorrow(),
        ]);

        // Attempt cancel by other user
        $responseUnauthorized = $this->actingAs($this->otherUmkmUser, 'sanctum')
            ->deleteJson("/api/group-buyings/{$groupBuying->id}");

        $responseUnauthorized->assertStatus(403);

        // Attempt cancel by creator
        $responseCreator = $this->actingAs($this->umkmUser, 'sanctum')
            ->deleteJson("/api/group-buyings/{$groupBuying->id}");

        $responseCreator->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertDatabaseHas('group_buyings', [
            'id' => $groupBuying->id,
            'status' => 'cancelled',
        ]);
    }

    /**
     * Test my-group-buyings listing.
     */
    public function test_can_list_my_created_group_buyings(): void
    {
        GroupBuying::factory()->create([
            'product_id' => $this->product->id,
            'creator_id' => $this->umkmUser->id,
        ]);

        GroupBuying::factory()->create([
            'product_id' => $this->product->id,
            'creator_id' => $this->otherUmkmUser->id,
        ]);

        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson('/api/my-group-buyings');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }

    /**
     * Test joined-group-buyings listing.
     */
    public function test_can_list_my_joined_group_buyings(): void
    {
        $groupBuying1 = GroupBuying::factory()->create([
            'product_id' => $this->product->id,
            'creator_id' => $this->umkmUser->id,
        ]);

        $groupBuying2 = GroupBuying::factory()->create([
            'product_id' => $this->product->id,
            'creator_id' => $this->umkmUser->id,
        ]);

        // Join groupBuying1
        GroupBuyingMember::create([
            'group_buying_id' => $groupBuying1->id,
            'user_id' => $this->otherUmkmUser->id,
            'quantity' => 10,
            'amount' => 100000.00,
        ]);

        $response = $this->actingAs($this->otherUmkmUser, 'sanctum')
            ->getJson('/api/joined-group-buyings');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $groupBuying1->id);
    }
}

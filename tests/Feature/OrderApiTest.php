<?php

namespace Tests\Feature;

use App\Models\GroupBuying;
use App\Models\GroupBuyingMember;
use App\Models\Order;
use App\Models\Product;
use App\Models\SupplierProfile;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class OrderApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $umkmUser;
    protected User $otherUmkmUser;
    protected User $supplierUser;
    protected User $otherSupplierUser;
    protected User $adminUser;
    protected Product $product;
    protected SupplierProfile $supplierProfile;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles & permissions
        $this->seed(RolePermissionSeeder::class);

        // Create UMKM users
        $this->umkmUser = User::factory()->create(['role' => 'umkm']);
        $this->umkmUser->assignRole('umkm');
        $this->umkmUser->umkmProfile()->create([
            'business_name' => 'UMKM Food',
            'business_type' => 'Kuliner',
            'business_address' => 'Jakarta',
            'district_city' => 'Jakarta',
            'raw_material_category' => 'Bahan Makanan',
            'monthly_need_estimate' => 300,
        ]);

        $this->otherUmkmUser = User::factory()->create(['role' => 'umkm']);
        $this->otherUmkmUser->assignRole('umkm');
        $this->otherUmkmUser->umkmProfile()->create([
            'business_name' => 'UMKM Clothes',
            'business_type' => 'Konveksi',
            'business_address' => 'Bandung',
            'district_city' => 'Bandung',
            'raw_material_category' => 'Kain',
            'monthly_need_estimate' => 400,
        ]);

        // Create Supplier users and Profiles
        $this->supplierUser = User::factory()->create(['role' => 'supplier']);
        $this->supplierUser->assignRole('supplier');
        $this->supplierProfile = SupplierProfile::factory()->create([
            'user_id' => $this->supplierUser->id,
        ]);

        $this->otherSupplierUser = User::factory()->create(['role' => 'supplier']);
        $this->otherSupplierUser->assignRole('supplier');
        SupplierProfile::factory()->create([
            'user_id' => $this->otherSupplierUser->id,
        ]);

        // Create Admin user
        $this->adminUser = User::factory()->create(['role' => 'admin']);
        $this->adminUser->assignRole('admin');

        // Create Product
        $this->product = Product::factory()->create([
            'supplier_id' => $this->supplierProfile->id,
            'price' => 5000.00,
        ]);
    }

    /**
     * Test single order creation.
     */
    public function test_umkm_user_can_create_single_order(): void
    {
        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->postJson('/api/orders', [
                'product_id' => $this->product->id,
                'quantity' => 10,
                'notes' => 'Tolong kirim cepat',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.quantity', 10)
            ->assertJsonPath('data.unit_price', 5000)
            ->assertJsonPath('data.total_price', 50000)
            ->assertJsonPath('data.type', 'single')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.payment_status', 'unpaid');

        $this->assertDatabaseHas('orders', [
            'buyer_id' => $this->umkmUser->id,
            'product_id' => $this->product->id,
            'quantity' => 10,
            'total_price' => 50000.00,
        ]);
    }

    /**
     * Test only UMKM users can create orders.
     */
    public function test_only_umkm_can_create_order(): void
    {
        $response = $this->actingAs($this->supplierUser, 'sanctum')
            ->postJson('/api/orders', [
                'product_id' => $this->product->id,
                'quantity' => 10,
            ]);

        $response->assertStatus(403);
    }

    /**
     * Test order validation.
     */
    public function test_order_creation_validation(): void
    {
        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->postJson('/api/orders', [
                'product_id' => 9999, // non-existent
                'quantity' => 0,      // must be > 0
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['product_id', 'quantity']);
    }

    /**
     * Test index listing visibility rules.
     */
    public function test_only_admin_can_list_all_orders(): void
    {
        Order::factory()->create([
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $this->product->id,
        ]);

        // Fail: UMKM attempts index
        $responseUmkm = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson('/api/orders');
        $responseUmkm->assertStatus(403);

        // Success: Admin attempts index
        $responseAdmin = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/orders');
        $responseAdmin->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    /**
     * Test detail page authorization logic.
     */
    public function test_user_can_view_authorized_order_details(): void
    {
        $order = Order::factory()->create([
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $this->product->id,
        ]);

        // Success: Buyer views
        $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson("/api/orders/{$order->id}")
            ->assertStatus(200);

        // Success: Supplier views
        $this->actingAs($this->supplierUser, 'sanctum')
            ->getJson("/api/orders/{$order->id}")
            ->assertStatus(200);

        // Fail: Other Supplier views
        $this->actingAs($this->otherSupplierUser, 'sanctum')
            ->getJson("/api/orders/{$order->id}")
            ->assertStatus(403);
    }

    /**
     * Test list-my-orders endpoint.
     */
    public function test_umkm_can_list_own_orders(): void
    {
        Order::factory()->create([
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $this->product->id,
        ]);

        Order::factory()->create([
            'buyer_id' => $this->otherUmkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $this->product->id,
        ]);

        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson('/api/my-orders');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    /**
     * Test list-supplier-orders endpoint.
     */
    public function test_supplier_can_list_received_orders(): void
    {
        Order::factory()->create([
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $this->product->id,
        ]);

        $response = $this->actingAs($this->supplierUser, 'sanctum')
            ->getJson('/api/supplier-orders');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    /**
     * Test supplier updating order status.
     */
    public function test_supplier_can_update_order_status_following_flow(): void
    {
        $order = Order::factory()->create([
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $this->product->id,
            'status' => 'pending',
        ]);

        // 1. Update from pending to paid
        $response = $this->actingAs($this->supplierUser, 'sanctum')
            ->patchJson("/api/orders/{$order->id}/status", [
                'status' => 'paid',
            ]);
        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'paid');

        // 2. Fail update to non-consecutive status (paid -> shipped fails, must go to processing)
        $responseInvalid = $this->actingAs($this->supplierUser, 'sanctum')
            ->patchJson("/api/orders/{$order->id}/status", [
                'status' => 'shipped',
            ]);
        $responseInvalid->assertStatus(422);

        // 3. Update from paid to processing
        $this->actingAs($this->supplierUser, 'sanctum')
            ->patchJson("/api/orders/{$order->id}/status", ['status' => 'processing'])
            ->assertStatus(200);

        // 4. Update from processing to shipped
        $this->actingAs($this->supplierUser, 'sanctum')
            ->patchJson("/api/orders/{$order->id}/status", ['status' => 'shipped'])
            ->assertStatus(200);

        // 5. Update from shipped to completed
        $this->actingAs($this->supplierUser, 'sanctum')
            ->patchJson("/api/orders/{$order->id}/status", ['status' => 'completed'])
            ->assertStatus(200);
    }

    /**
     * Test cancelled logic restrictions.
     */
    public function test_cannot_cancel_order_after_shipped(): void
    {
        $order = Order::factory()->create([
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $this->product->id,
            'status' => 'shipped',
        ]);

        $response = $this->actingAs($this->supplierUser, 'sanctum')
            ->patchJson("/api/orders/{$order->id}/status", [
                'status' => 'cancelled',
            ]);

        $response->assertStatus(422);
    }

    /**
     * Test payment status updates.
     */
    public function test_updating_payment_status_to_paid_automates_order_status_update(): void
    {
        $order = Order::factory()->create([
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $this->product->id,
            'status' => 'pending',
            'payment_status' => 'unpaid',
        ]);

        $response = $this->actingAs($this->umkmUser, 'sanctum')
            ->patchJson("/api/orders/{$order->id}/payment", [
                'payment_status' => 'paid',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.payment_status', 'paid')
            ->assertJsonPath('data.status', 'paid');

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'payment_status' => 'paid',
            'status' => 'paid',
        ]);
    }

    /**
     * Test group buying orders generation automation.
     */
    public function test_group_buying_campaign_completion_automatically_creates_orders_for_members(): void
    {
        // 1. Create a group buying campaign
        $groupBuying = GroupBuying::factory()->create([
            'product_id' => $this->product->id,
            'creator_id' => $this->umkmUser->id,
            'target_quantity' => 100,
            'current_quantity' => 50,
            'min_participants' => 2,
            'deadline' => Carbon::tomorrow(),
            'status' => 'open',
        ]);

        // 2. Add members
        GroupBuyingMember::create([
            'group_buying_id' => $groupBuying->id,
            'user_id' => $this->umkmUser->id,
            'quantity' => 50,
            'amount' => 250000.00,
        ]);

        // 3. Join with enough quantity to complete target (current_quantity reaches 100)
        // This will call updateStatus() in GroupBuyingService and trigger createGroupBuyingOrders()
        $response = $this->actingAs($this->otherUmkmUser, 'sanctum')
            ->postJson("/api/group-buyings/{$groupBuying->id}/join", [
                'quantity' => 50,
            ]);

        $response->assertStatus(201);

        // Verify status transitioned to completed
        $this->assertDatabaseHas('group_buyings', [
            'id' => $groupBuying->id,
            'status' => 'completed',
            'current_quantity' => 100,
        ]);

        // Verify that 2 orders were generated (one for each member)
        $this->assertDatabaseCount('orders', 2);
        
        $this->assertDatabaseHas('orders', [
            'buyer_id' => $this->umkmUser->id,
            'group_buying_id' => $groupBuying->id,
            'quantity' => 50,
            'total_price' => 250000.00,
            'type' => 'group',
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('orders', [
            'buyer_id' => $this->otherUmkmUser->id,
            'group_buying_id' => $groupBuying->id,
            'quantity' => 50,
            'total_price' => 250000.00,
            'type' => 'group',
            'status' => 'pending',
        ]);
    }
}

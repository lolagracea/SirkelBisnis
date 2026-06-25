<?php

namespace Tests\Feature;

use App\Models\GroupBuying;
use App\Models\GroupBuyingMember;
use App\Models\Order;
use App\Models\Product;
use App\Models\SupplierProfile;
use App\Models\User;
use App\Models\Notification;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class NotificationApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $umkmUser;
    protected User $otherUmkmUser;
    protected User $supplierUser;
    protected Product $product;
    protected SupplierProfile $supplierProfile;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);

        // Create UMKM user
        $this->umkmUser = User::factory()->create(['role' => 'umkm', 'name' => 'UMKM Buyer']);
        $this->umkmUser->assignRole('umkm');
        $this->umkmUser->umkmProfile()->create([
            'business_name' => 'Katering Budi',
            'business_type' => 'Kuliner',
            'business_address' => 'Malang',
            'district_city' => 'Malang',
            'raw_material_category' => 'Beras',
            'monthly_need_estimate' => 200,
        ]);

        $this->otherUmkmUser = User::factory()->create(['role' => 'umkm', 'name' => 'UMKM Teman']);
        $this->otherUmkmUser->assignRole('umkm');
        $this->otherUmkmUser->umkmProfile()->create([
            'business_name' => 'Katering Ani',
            'business_type' => 'Kuliner',
            'business_address' => 'Malang',
            'district_city' => 'Malang',
            'raw_material_category' => 'Beras',
            'monthly_need_estimate' => 150,
        ]);

        // Create Supplier user & profile
        $this->supplierUser = User::factory()->create(['role' => 'supplier']);
        $this->supplierUser->assignRole('supplier');
        $this->supplierProfile = SupplierProfile::factory()->create([
            'user_id' => $this->supplierUser->id,
            'supplier_name' => 'Toko Tani Sejahtera',
        ]);

        // Create Product
        $this->product = Product::factory()->create([
            'supplier_id' => $this->supplierProfile->id,
            'name' => 'Beras Cianjur Super',
            'price' => 12000.00,
        ]);
    }

    /**
     * Test single order creation triggers notification for the supplier.
     */
    public function test_single_order_triggers_notification_for_supplier(): void
    {
        $this->actingAs($this->umkmUser, 'sanctum')
            ->postJson('/api/orders', [
                'product_id' => $this->product->id,
                'quantity' => 20,
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->supplierUser->id,
            'title' => 'Pesanan Masuk Baru',
            'type' => 'order',
        ]);
    }

    /**
     * Test supplier status update triggers notification for the buyer.
     */
    public function test_updating_order_status_triggers_notification_for_buyer(): void
    {
        $order = Order::factory()->create([
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierProfile->id,
            'product_id' => $this->product->id,
            'status' => 'pending',
        ]);

        $this->actingAs($this->supplierUser, 'sanctum')
            ->patchJson("/api/orders/{$order->id}/status", [
                'status' => 'paid',
            ])
            ->assertStatus(200);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->umkmUser->id,
            'title' => 'Status Pesanan Diperbarui',
            'type' => 'order',
        ]);
    }

    /**
     * Test group buying actions trigger notifications.
     */
    public function test_group_buying_actions_trigger_notifications(): void
    {
        // 1. Create a group buying
        $gb = $this->actingAs($this->umkmUser, 'sanctum')
            ->postJson('/api/group-buyings', [
                'product_id' => $this->product->id,
                'target_quantity' => 100,
                'min_participants' => 2,
                'deadline' => Carbon::tomorrow()->toDateString(),
            ]);
        $gb->assertStatus(201);
        $gbId = $gb->json('data.id');

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->umkmUser->id,
            'title' => 'Program Patungan Dibuat',
            'type' => 'patungan',
        ]);

        // Join manually (add creator member)
        GroupBuyingMember::create([
            'group_buying_id' => $gbId,
            'user_id' => $this->umkmUser->id,
            'quantity' => 40,
            'amount' => 480000.00,
        ]);

        // Manually update current_quantity to reflect manual join
        $gbModel = GroupBuying::find($gbId);
        $gbModel->current_quantity = 40;
        $gbModel->save();

        // 2. Another user joins
        $this->actingAs($this->otherUmkmUser, 'sanctum')
            ->postJson("/api/group-buyings/{$gbId}/join", [
                'quantity' => 60, // Total 100 (triggers completed)
            ])
            ->assertStatus(201);

        // Verify other user got "Berhasil Ikut Patungan" notification
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->otherUmkmUser->id,
            'title' => 'Berhasil Ikut Patungan',
            'type' => 'patungan',
        ]);

        // Verify creator got "Anggota Baru Patungan" notification
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->umkmUser->id,
            'title' => 'Anggota Baru Patungan',
            'type' => 'patungan',
        ]);

        // Verify creator got "Patungan Berhasil" notification
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->umkmUser->id,
            'title' => 'Patungan Berhasil',
            'type' => 'patungan',
        ]);
    }

    /**
     * Test notification resource API operations.
     */
    public function test_notification_resource_api_actions(): void
    {
        // Pre-create notifications
        $n1 = Notification::create([
            'user_id' => $this->umkmUser->id,
            'title' => 'Notif 1',
            'message' => 'Detail 1',
            'type' => 'system',
        ]);

        $n2 = Notification::create([
            'user_id' => $this->umkmUser->id,
            'title' => 'Notif 2',
            'message' => 'Detail 2',
            'type' => 'order',
        ]);

        // 1. Get notifications
        $responseGet = $this->actingAs($this->umkmUser, 'sanctum')
            ->getJson('/api/notifications');
        $responseGet->assertStatus(200)
            ->assertJsonCount(2, 'data');

        // 2. Mark specific as read
        $this->actingAs($this->umkmUser, 'sanctum')
            ->putJson("/api/notifications/{$n1->id}/read")
            ->assertStatus(200);

        $this->assertTrue($n1->fresh()->is_read);

        // 3. Mark all as read
        $this->actingAs($this->umkmUser, 'sanctum')
            ->putJson('/api/notifications/read-all')
            ->assertStatus(200);

        $this->assertTrue($n2->fresh()->is_read);

        // 4. Delete notification
        $this->actingAs($this->umkmUser, 'sanctum')
            ->deleteJson("/api/notifications/{$n1->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('notifications', ['id' => $n1->id]);
    }
}

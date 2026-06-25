<?php

namespace Tests\Feature;

use App\Models\GroupBuying;
use App\Models\Order;
use App\Models\Product;
use App\Models\SupplierProfile;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Inertia\Testing\AssertableInertia as Assert;

class UmkmDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected User $umkmUser;
    protected User $supplierUser;
    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles & permissions
        $this->seed(RolePermissionSeeder::class);

        // Create UMKM user
        $this->umkmUser = User::factory()->create(['role' => 'umkm']);
        $this->umkmUser->assignRole('umkm');
        $this->umkmUser->umkmProfile()->create([
            'business_name' => 'Test UMKM Keripik',
            'business_type' => 'Makanan',
            'business_address' => 'Malang',
            'district_city' => 'Malang',
            'raw_material_category' => 'Tepung',
            'monthly_need_estimate' => 300,
        ]);

        // Create Supplier
        $this->supplierUser = User::factory()->create(['role' => 'supplier']);
        $this->supplierUser->assignRole('supplier');
        SupplierProfile::factory()->create([
            'user_id' => $this->supplierUser->id,
            'supplier_name' => 'Supplier Tepung Mitra',
            'sirkel_score' => 95.00,
            'rating' => 4.8,
        ]);

        // Create Admin
        $this->adminUser = User::factory()->create(['role' => 'admin']);
        $this->adminUser->assignRole('admin');
    }

    /**
     * Test guest cannot access UMKM dashboard.
     */
    public function test_guest_cannot_access_umkm_dashboard(): void
    {
        $response = $this->get('/umkm/dashboard');
        $response->assertRedirect(route('login.form'));
    }

    /**
     * Test other roles cannot access UMKM dashboard.
     */
    public function test_supplier_cannot_access_umkm_dashboard(): void
    {
        $response = $this->actingAs($this->supplierUser)
            ->get('/umkm/dashboard');

        $response->assertStatus(403);
    }

    public function test_admin_cannot_access_umkm_dashboard(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->get('/umkm/dashboard');

        $response->assertStatus(403);
    }

    /**
     * Test authorized UMKM can access dashboard and receive correct props.
     */
    public function test_umkm_can_access_dashboard_with_props(): void
    {
        // Let's create some dummy data to ensure the controller executes queries correctly
        $product = Product::factory()->create([
            'supplier_id' => $this->supplierUser->supplierProfile->id,
            'name' => 'Tepung Terigu 25kg',
            'category' => 'Tepung',
        ]);

        GroupBuying::factory()->create([
            'product_id' => $product->id,
            'creator_id' => $this->umkmUser->id,
            'target_quantity' => 100,
            'current_quantity' => 20,
            'status' => 'open',
            'deadline' => now()->addDays(5),
        ]);

        Order::factory()->create([
            'buyer_id' => $this->umkmUser->id,
            'supplier_id' => $this->supplierUser->supplierProfile->id,
            'product_id' => $product->id,
            'quantity' => 10,
            'total_price' => 150000,
            'status' => 'pending',
            'type' => 'single',
        ]);

        $response = $this->actingAs($this->umkmUser)
            ->get('/umkm/dashboard');

        $response->assertStatus(200);

        // Verify Inertia response props structure
        $response->assertInertia(fn (Assert $page) => $page
            ->component('UMKM/Dashboard')
            ->has('profile', fn (Assert $page) => $page
                ->where('business_name', 'Test UMKM Keripik')
                ->where('business_type', 'Makanan')
                ->where('raw_material_category', 'Tepung')
                ->where('monthly_need_estimate', 300)
            )
            ->has('stats', fn (Assert $page) => $page
                ->where('active_group_buying', 1)
                ->where('active_orders', 1)
                ->has('monthly_savings')
                ->has('sirkel_score')
            )
            ->has('activeGroupBuying')
            ->has('recommendedSuppliers')
            ->has('recentOrders')
            ->has('aiInsight', fn (Assert $page) => $page
                ->has('business_condition')
                ->has('saving_opportunity')
                ->has('group_buying_recommendation')
                ->has('restock_recommendation')
                ->has('business_advice')
            )
            ->has('auth.user', fn (Assert $page) => $page
                ->where('id', $this->umkmUser->id)
                ->where('name', $this->umkmUser->name)
                ->where('email', $this->umkmUser->email)
                ->where('role', 'umkm')
            )
        );
    }
}

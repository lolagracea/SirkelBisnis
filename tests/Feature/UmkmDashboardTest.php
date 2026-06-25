<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UmkmDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    /**
     * Test SPA wildcard routing serves the app view for web routes.
     */
    public function test_spa_routing_serves_app_view_for_dashboard_routes(): void
    {
        $response = $this->get('/umkm/dashboard');
        $response->assertStatus(200);
        $response->assertViewIs('app');
    }

    public function test_spa_routing_serves_app_view_for_supplier_dashboard_routes(): void
    {
        $response = $this->get('/supplier/dashboard');
        $response->assertStatus(200);
        $response->assertViewIs('app');
    }

    public function test_spa_routing_serves_app_view_for_login_routes(): void
    {
        $response = $this->get('/login');
        $response->assertStatus(200);
        $response->assertViewIs('app');
    }
}

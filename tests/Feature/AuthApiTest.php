<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UmkmProfile;
use App\Models\SupplierProfile;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    /**
     * Test successful login with email.
     */
    public function test_can_login_with_email(): void
    {
        $user = User::factory()->create([
            'email' => 'umkm@test.com',
            'phone_number' => '081234567890',
            'password' => Hash::make('password123'),
            'role' => 'umkm',
            'account_status' => 'active',
        ]);
        $user->assignRole('umkm');

        $response = $this->postJson('/api/login', [
            'login' => 'umkm@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['success', 'message', 'token', 'user']);
    }

    /**
     * Test successful login with phone number.
     */
    public function test_can_login_with_phone_number(): void
    {
        $user = User::factory()->create([
            'email' => 'umkm2@test.com',
            'phone_number' => '081234567891',
            'password' => Hash::make('password123'),
            'role' => 'umkm',
            'account_status' => 'active',
        ]);
        $user->assignRole('umkm');

        $response = $this->postJson('/api/login', [
            'login' => '081234567891',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    /**
     * Test login fails with invalid credentials.
     */
    public function test_login_fails_with_invalid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'umkm@test.com',
            'password' => Hash::make('password123'),
            'account_status' => 'active',
        ]);

        $response = $this->postJson('/api/login', [
            'login' => 'umkm@test.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    /**
     * Test login fails for inactive users.
     */
    public function test_login_fails_for_inactive_user(): void
    {
        $user = User::factory()->create([
            'email' => 'umkm@test.com',
            'password' => Hash::make('password123'),
            'account_status' => 'suspended',
        ]);

        $response = $this->postJson('/api/login', [
            'login' => 'umkm@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    /**
     * Test UMKM registration.
     */
    public function test_can_register_umkm(): void
    {
        $response = $this->postJson('/api/register/umkm', [
            'name' => 'Budi UMKM',
            'nik' => '3201234567890123',
            'phone_number' => '081234567892',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
            'business_name' => 'Budi Catering',
            'business_type' => 'Kuliner',
            'business_address' => 'Jl. Merdeka No. 10',
            'district_city' => 'Malang',
            'raw_material_category' => 'Bahan Pangan',
            'monthly_need_estimate' => 200,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['success', 'message', 'token', 'user']);

        $this->assertDatabaseHas('users', [
            'name' => 'Budi UMKM',
            'phone_number' => '081234567892',
            'role' => 'umkm',
        ]);

        $this->assertDatabaseHas('umkm_profiles', [
            'business_name' => 'Budi Catering',
            'business_type' => 'Kuliner',
            'monthly_need_estimate' => 200,
        ]);
    }

    /**
     * Test Supplier registration.
     */
    public function test_can_register_supplier(): void
    {
        $response = $this->postJson('/api/register/supplier', [
            'name' => 'Joko Supplier',
            'nik' => '3201234567890124',
            'phone_number' => '081234567893',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
            'supplier_name' => 'Joko Sembako Jaya',
            'address' => 'Kawasan Industri Gresik',
            'description' => 'Supplier sembako skala grosir.',
            'latitude' => -7.123,
            'longitude' => 112.456,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('users', [
            'name' => 'Joko Supplier',
            'phone_number' => '081234567893',
            'role' => 'supplier',
        ]);

        $this->assertDatabaseHas('supplier_profiles', [
            'supplier_name' => 'Joko Sembako Jaya',
            'address' => 'Kawasan Industri Gresik',
        ]);
    }

    /**
     * Test successful logout.
     */
    public function test_can_logout(): void
    {
        $user = User::factory()->create([
            'email' => 'umkm@test.com',
            'role' => 'umkm',
            'account_status' => 'active',
        ]);
        $user->assignRole('umkm');
        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/logout');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }
}

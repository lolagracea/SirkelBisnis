<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@sirkelbisnis.com'],
            [
                'name' => 'Nama Admin',
                'phone_number' => '081234567890',
                'role' => 'admin',
                'admin_role' => 'super_admin',
                'permissions' => [
                    'admin.verifikasi',
                    'admin.monitoring',
                    'admin.dispute',
                    'admin.kelola-user',
                ],
                'account_status' => 'active',
                'password' => Hash::make('Admin#SirkelBisnis2026'),
            ],
        );

        $admin->assignRole('admin');
    }
}

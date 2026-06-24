<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'pembeli.patungan',
            'pembeli.beli-bahan',
            'supplier.kelola-stok',
            'supplier.kelola-pesanan',
            'admin.verifikasi',
            'admin.monitoring',
            'admin.dispute',
            'admin.kelola-user',
        ];

        $permissionModels = collect($permissions)->mapWithKeys(function (string $permission) {
            return [
                $permission => Permission::query()->updateOrCreate(
                    ['name' => $permission, 'guard_name' => 'web'],
                    ['name' => $permission, 'guard_name' => 'web'],
                ),
            ];
        });

        Role::query()->updateOrCreate(['name' => 'umkm', 'guard_name' => 'web'])
            ->syncPermissions($permissionModels->only([
                'pembeli.patungan',
                'pembeli.beli-bahan',
            ])->values());

        Role::query()->updateOrCreate(['name' => 'supplier', 'guard_name' => 'web'])
            ->syncPermissions($permissionModels->only([
                'supplier.kelola-stok',
                'supplier.kelola-pesanan',
            ])->values());

        Role::query()->updateOrCreate(['name' => 'admin', 'guard_name' => 'web'])
            ->syncPermissions($permissionModels->values());

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}

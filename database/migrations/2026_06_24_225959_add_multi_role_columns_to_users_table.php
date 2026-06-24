<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('email')->nullable()->change();
            $table->string('phone_number', 20)->unique()->after('email');
            $table->string('nik', 16)->nullable()->unique()->after('phone_number');
            $table->enum('role', ['umkm', 'supplier', 'admin'])->default('umkm')->index()->after('nik');
            $table->enum('account_status', ['pending', 'active', 'suspended'])->default('pending')->index()->after('role');
            $table->string('admin_role')->nullable()->after('account_status');
            $table->json('permissions')->nullable()->after('admin_role');
            $table->timestamp('last_login_at')->nullable()->after('permissions');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('email')->nullable(false)->change();
            $table->dropColumn([
                'phone_number',
                'nik',
                'role',
                'account_status',
                'admin_role',
                'permissions',
                'last_login_at',
            ]);
        });
    }
};

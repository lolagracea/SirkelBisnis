<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('supplier_id')->nullable()->constrained('supplier_profiles')->nullOnDelete();
            $table->string('supplier_role')->nullable()->comment('admin, finance, warehouse');
        });

        Schema::table('supplier_profiles', function (Blueprint $table) {
            $table->string('npwp')->nullable();
            $table->decimal('tax_rate', 5, 2)->default(11.00); // 11% by default
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->dropColumn(['supplier_id', 'supplier_role']);
        });

        Schema::table('supplier_profiles', function (Blueprint $table) {
            $table->dropColumn(['npwp', 'tax_rate']);
        });
    }
};

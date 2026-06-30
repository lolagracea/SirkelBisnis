<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplier_profiles', function (Blueprint $table) {
            $table->string('province')->nullable()->after('address');
            $table->string('district_city')->nullable()->after('province');
            $table->string('kecamatan')->nullable()->after('district_city');
            $table->string('kelurahan')->nullable()->after('kecamatan');
            $table->string('street_address')->nullable()->after('kelurahan');
        });
    }

    public function down(): void
    {
        Schema::table('supplier_profiles', function (Blueprint $table) {
            $table->dropColumn(['province', 'district_city', 'kecamatan', 'kelurahan', 'street_address']);
        });
    }
};

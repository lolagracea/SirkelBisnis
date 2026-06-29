<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('umkm_profiles', function (Blueprint $table) {
            // Pecah alamat jadi 3 kolom yang terstruktur
            $table->string('province')->nullable()->after('district_city');
            $table->string('street_address')->nullable()->after('province');
            // business_address tetap ada sebagai alamat gabungan lengkap (untuk tampilan)
        });
    }

    public function down(): void
    {
        Schema::table('umkm_profiles', function (Blueprint $table) {
            $table->dropColumn(['province', 'street_address']);
        });
    }
};

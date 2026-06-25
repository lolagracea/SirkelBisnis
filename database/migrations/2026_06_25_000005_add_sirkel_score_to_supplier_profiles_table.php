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
        Schema::table('supplier_profiles', function (Blueprint $table) {
            $table->decimal('sirkel_score', 5, 2)->default(0.00)->after('rating');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('supplier_profiles', function (Blueprint $table) {
            $table->dropColumn('sirkel_score');
        });
    }
};

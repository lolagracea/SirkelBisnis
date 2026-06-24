<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('umkm_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('business_name');
            $table->string('business_type');
            $table->text('business_address');
            $table->string('district_city');
            $table->string('raw_material_category');
            $table->unsignedInteger('monthly_need_estimate');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('umkm_profiles');
    }
};

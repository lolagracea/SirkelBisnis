<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('credit_limits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained('supplier_profiles')->onDelete('cascade');
            $table->foreignId('umkm_id')->constrained('umkm_profiles')->onDelete('cascade');
            $table->decimal('limit_amount', 15, 2)->default(0);
            $table->decimal('used_amount', 15, 2)->default(0);
            $table->integer('term_days')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_limits');
    }
};

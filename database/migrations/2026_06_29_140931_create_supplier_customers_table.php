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
        Schema::create('supplier_customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained('supplier_profiles')->cascadeOnDelete();
            $table->foreignId('umkm_id')->constrained('users')->cascadeOnDelete();
            $table->string('tier')->default('regular'); // 'regular', 'vip'
            $table->decimal('discount_percentage', 5, 2)->default(0);
            $table->timestamps();
            
            $table->unique(['supplier_id', 'umkm_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_customers');
    }
};

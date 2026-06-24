<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('store_name');
            $table->text('warehouse_address');
            $table->string('product_category');
            $table->decimal('price', 15, 2);
            $table->unsignedInteger('stock');
            $table->unsignedInteger('minimum_order');
            $table->string('delivery_area');
            $table->string('business_tax_number')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_profiles');
    }
};

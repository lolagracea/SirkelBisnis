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
        Schema::create('supplier_offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_buying_id')
                  ->constrained('group_buyings')
                  ->cascadeOnDelete();
            $table->foreignId('supplier_id')
                  ->constrained('supplier_profiles')
                  ->cascadeOnDelete();
            $table->decimal('price_per_unit', 15, 2);
            $table->decimal('total_price', 15, 2);
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'accepted', 'rejected'])->default('pending');
            $table->timestamps();

            // Satu supplier hanya boleh mengajukan satu penawaran per patungan
            $table->unique(['group_buying_id', 'supplier_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_offers');
    }
};

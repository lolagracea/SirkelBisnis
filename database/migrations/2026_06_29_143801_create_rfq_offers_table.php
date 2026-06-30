<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rfq_offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfq_id')->constrained()->onDelete('cascade');
            $table->decimal('supplier_price', 15, 2);
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rfq_offers');
    }
};

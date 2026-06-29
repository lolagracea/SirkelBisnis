<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kecamatans', function (Blueprint $table) {
            $table->id();
            $table->string('emsifa_id', 10)->unique();
            $table->foreignId('city_id')->constrained('cities')->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();

            $table->index(['city_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kecamatans');
    }
};

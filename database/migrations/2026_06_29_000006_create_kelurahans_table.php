<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kelurahans', function (Blueprint $table) {
            $table->id();
            $table->string('emsifa_id', 15)->unique();
            $table->foreignId('kecamatan_id')->constrained('kecamatans')->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();

            $table->index(['kecamatan_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kelurahans');
    }
};

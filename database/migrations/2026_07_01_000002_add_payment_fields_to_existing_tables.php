<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tambah kolom fee & net_amount ke wallet_transactions yang sudah ada
        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->decimal('fee', 15, 2)->default(0)->after('amount'); // Biaya admin/Xendit
            $table->decimal('net_amount', 15, 2)->nullable()->after('fee'); // Jumlah bersih setelah dipotong fee
            $table->string('reference_id')->nullable()->after('description'); // Referensi ke payment_transaction
        });

        // Tambah kolom payment_method ke invoices untuk membedakan cash vs tempo
        Schema::table('invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('invoices', 'payment_method')) {
                $table->enum('payment_method', ['cash', 'tempo'])->default('cash')->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->dropColumn(['fee', 'net_amount', 'reference_id']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            if (Schema::hasColumn('invoices', 'payment_method')) {
                $table->dropColumn('payment_method');
            }
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->string('xendit_id')->nullable()->unique(); // ID dari Xendit
            $table->enum('payment_method', ['QRIS', 'VA']); // Metode pembayaran
            $table->string('bank_code')->nullable(); // Untuk VA: BCA, MANDIRI, BNI, etc.
            $table->decimal('amount', 15, 2); // Jumlah yang harus dibayar
            $table->enum('status', ['pending', 'paid', 'expired', 'failed'])->default('pending');
            $table->text('qr_string')->nullable(); // String QR QRIS dari Xendit
            $table->string('qr_id')->nullable(); // ID QR dari Xendit
            $table->string('va_number')->nullable(); // Nomor Virtual Account
            $table->string('idempotency_key')->unique(); // Untuk mencegah duplikasi
            $table->timestamp('paid_at')->nullable(); // Waktu pembayaran berhasil
            $table->timestamp('expired_at')->nullable(); // Waktu kedaluwarsa
            $table->json('xendit_response')->nullable(); // Raw response dari Xendit (untuk debugging)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};

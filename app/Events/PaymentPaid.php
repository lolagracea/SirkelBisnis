<?php

namespace App\Events;

use App\Models\Invoice;
use App\Models\PaymentTransaction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * PaymentPaid — Event yang di-broadcast ke dua channel:
 *
 *  1. `private-umkm.{umkm_user_id}`
 *     → Diterima oleh UMKM untuk update status invoice menjadi "Lunas"
 *
 *  2. `private-supplier.{supplier_user_id}`
 *     → Diterima oleh Supplier untuk update saldo wallet secara real-time
 *
 * Event ini di-broadcast setelah webhook Xendit berhasil diproses
 * dan DB::transaction() selesai di-commit.
 */
class PaymentPaid implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Invoice            $invoice,
        public readonly PaymentTransaction $transaction,
        public readonly int                $umkmUserId,
        public readonly int                $supplierUserId,
        public readonly float              $newSupplierBalance,
        public readonly float              $netAmount,
        public readonly float              $fee,
    ) {}

    /**
     * Channel yang akan menerima broadcast.
     * UMKM dan Supplier masing-masing mendapat channel private sendiri.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("umkm.{$this->umkmUserId}"),
            new PrivateChannel("supplier.{$this->supplierUserId}"),
        ];
    }

    /**
     * Nama event yang dikirim ke frontend (digunakan di Pusher/Reverb listener).
     */
    public function broadcastAs(): string
    {
        return 'payment.paid';
    }

    /**
     * Data yang dikirim ke frontend.
     */
    public function broadcastWith(): array
    {
        return [
            'invoice' => [
                'id'             => $this->invoice->id,
                'status'         => $this->invoice->status,
                'amount'         => $this->invoice->amount,
                'payment_method' => $this->invoice->payment_method,
            ],
            'transaction' => [
                'id'             => $this->transaction->id,
                'payment_method' => $this->transaction->payment_method,
                'amount'         => $this->transaction->amount,
                'paid_at'        => $this->transaction->paid_at?->toIso8601String(),
            ],
            'supplier_wallet' => [
                'new_balance' => $this->newSupplierBalance,
                'net_amount'  => $this->netAmount,
                'fee'         => $this->fee,
            ],
        ];
    }
}

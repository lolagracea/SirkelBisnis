<?php

namespace App\Http\Controllers\API;

use App\Events\PaymentPaid;
use App\Http\Controllers\Controller;
use App\Models\CreditLimit;
use App\Models\Invoice;
use App\Models\PaymentTransaction;
use App\Services\Payment\FeeCalculatorService;
use App\Services\Payment\WalletService;
use App\Services\Payment\XenditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * XenditWebhookController — Menerima konfirmasi pembayaran dari Xendit.
 *
 * ENDPOINT (tanpa auth, divalidasi via x-callback-token):
 *   POST /api/webhook/xendit/qris   → QRIS payment notification
 *   POST /api/webhook/xendit/va     → Virtual Account payment notification
 *
 * Alur (Atomic DB Transaction):
 *   1. Validasi token header x-callback-token
 *   2. Idempotency check — jika sudah paid, return 200 langsung
 *   3. DB::transaction():
 *      a. Update PaymentTransaction.status = 'paid'
 *      b. Update Invoice.status = 'paid'
 *      c. Jika tempo: update CreditLimit.used_amount
 *      d. WalletService::credit() dengan lockForUpdate
 *   4. Broadcast PaymentPaid event ke Reverb/Pusher
 */
class XenditWebhookController extends Controller
{
    public function __construct(
        private readonly XenditService        $xendit,
        private readonly WalletService        $walletService,
        private readonly FeeCalculatorService $feeCalculator,
    ) {}

    // ──────────────────────────────────────────────
    //  QRIS Webhook
    // ──────────────────────────────────────────────

    /**
     * POST /api/webhook/xendit/qris
     * Xendit mengirim payload setelah QR dibayar.
     */
    public function handleQris(Request $request): JsonResponse
    {
        $data = $request->all();

        Log::info('[Webhook] QRIS received', ['payload' => $data]);

        // Xendit mengirim status 'SUCCEEDED' untuk QRIS yang berhasil
        if (($data['status'] ?? '') !== 'SUCCEEDED') {
            return response()->json(['message' => 'Status bukan SUCCEEDED, diabaikan.'], 200);
        }

        return $this->processPayment(
            request:       $request,
            referenceId:   $data['reference_id'] ?? '',
            xenditId:      $data['id'] ?? '',
            paymentMethod: 'QRIS',
        );
    }

    // ──────────────────────────────────────────────
    //  VA Webhook
    // ──────────────────────────────────────────────

    /**
     * POST /api/webhook/xendit/va
     * Xendit mengirim payload setelah VA dibayar.
     */
    public function handleVa(Request $request): JsonResponse
    {
        $data = $request->all();

        Log::info('[Webhook] VA received', ['payload' => $data]);

        // Xendit mengirim status 'PAID' untuk VA yang berhasil
        if (($data['status'] ?? '') !== 'PAID') {
            return response()->json(['message' => 'Status bukan PAID, diabaikan.'], 200);
        }

        return $this->processPayment(
            request:       $request,
            referenceId:   $data['external_id'] ?? '',
            xenditId:      $data['id'] ?? '',
            paymentMethod: 'VA',
        );
    }

    // ──────────────────────────────────────────────
    //  Core Processing (Atomic)
    // ──────────────────────────────────────────────

    /**
     * Proses konfirmasi pembayaran secara atomic.
     *
     * @param  Request $request
     * @param  string  $referenceId   Idempotency key yang kita buat saat checkout
     * @param  string  $xenditId      ID transaksi dari Xendit
     * @param  string  $paymentMethod 'QRIS' atau 'VA'
     */
    private function processPayment(
        Request $request,
        string $referenceId,
        string $xenditId,
        string $paymentMethod
    ): JsonResponse {
        // ── STEP 1: Validasi Token ────────────────────────────────────
        $incomingToken = $request->header('x-callback-token', '');
        if (!$this->xendit->validateWebhookToken($incomingToken)) {
            Log::warning('[Webhook] Token tidak valid', ['ip' => $request->ip()]);
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // ── STEP 2: Temukan Transaksi ─────────────────────────────────
        $transaction = PaymentTransaction::where('idempotency_key', $referenceId)->first();

        if (!$transaction) {
            Log::error('[Webhook] Transaksi tidak ditemukan', ['ref' => $referenceId]);
            // Return 200 agar Xendit tidak retry terus-menerus
            return response()->json(['message' => 'Transaction not found'], 200);
        }

        // ── STEP 3: Idempotency Guard ─────────────────────────────────
        // Jika sudah paid sebelumnya (webhook duplikat), langsung return 200
        if ($transaction->isPaid()) {
            Log::info('[Webhook] Idempotency: sudah paid, skip.', ['ref' => $referenceId]);
            return response()->json(['message' => 'Already processed'], 200);
        }

        // ── STEP 4: Load Relasi yang Dibutuhkan ───────────────────────
        $invoice = $transaction->invoice()->with([
            'order.buyer.umkmProfile',
            'order.product.supplier.user',
        ])->first();

        if (!$invoice) {
            Log::error('[Webhook] Invoice tidak ditemukan', ['transaction_id' => $transaction->id]);
            return response()->json(['message' => 'Invoice not found'], 200);
        }

        $order           = $invoice->order;
        $umkmProfile     = $order->buyer ? $order->buyer->umkmProfile : null;
        $supplierProfile = $order->product->supplier;

        if (!$umkmProfile || !$supplierProfile) {
            Log::error('[Webhook] UMKM atau Supplier profile tidak ditemukan', [
                'invoice_id' => $invoice->id,
            ]);
            return response()->json(['message' => 'Profile not found'], 200);
        }

        // Hitung fee
        $feeData = $this->feeCalculator->calculate(
            amount: (float) $transaction->amount,
            method: $paymentMethod
        );

        // ── STEP 5: Atomic DB Transaction ─────────────────────────────
        try {
            DB::transaction(function () use (
                $transaction, $invoice, $order,
                $umkmProfile, $supplierProfile,
                $xenditId, $paymentMethod, $feeData
            ) {
                // 5a. Update status PaymentTransaction
                $transaction->update([
                    'xendit_id' => $xenditId,
                    'status'    => 'paid',
                    'paid_at'   => now(),
                ]);

                // 5b. Update status Invoice menjadi 'paid'
                $invoice->update(['status' => 'paid']);

                // 5c. Update Order payment_status
                $order->update(['payment_status' => 'paid']);

                // 5d. Jika metode pembayaran TEMPO: update CreditLimit.used_amount
                if ($invoice->payment_method === 'tempo' && $invoice->payment_term_days > 0) {
                    $creditLimit = CreditLimit::where('supplier_id', $supplierProfile->id)
                        ->where('umkm_id', $umkmProfile->id)
                        ->lockForUpdate()
                        ->first();

                    if ($creditLimit) {
                        // Kurangi used_amount ketika invoice sudah dibayar (lunas)
                        $newUsed = max(0, $creditLimit->used_amount - (float) $invoice->amount);
                        $creditLimit->update(['used_amount' => $newUsed]);

                        Log::info('[Webhook] CreditLimit updated', [
                            'supplier_id'  => $supplierProfile->id,
                            'umkm_id'      => $umkmProfile->id,
                            'old_used'     => $creditLimit->used_amount,
                            'new_used'     => $newUsed,
                        ]);
                    }
                }

                // 5e. Kredit saldo supplier (dengan lockForUpdate via WalletService)
                $this->walletService->credit(
                    supplierId:  $supplierProfile->id,
                    grossAmount: (float) $transaction->amount,
                    fee:         $feeData['fee'],
                    referenceId: $transaction->idempotency_key,
                    description: "Pembayaran dari {$umkmProfile->business_name} via {$transaction->payment_method}",
                );
            });
        } catch (\Throwable $e) {
            Log::error('[Webhook] DB Transaction gagal', [
                'error'      => $e->getMessage(),
                'ref'        => $referenceId,
                'invoice_id' => $invoice->id,
            ]);

            // Return 500 agar Xendit akan retry
            return response()->json(['message' => 'Internal processing error'], 500);
        }

        // ── STEP 6: Broadcast Real-time Event ─────────────────────────
        // Refresh model untuk mendapatkan data terbaru setelah DB transaction
        $transaction->refresh();
        $supplierProfile->refresh();

        try {
            broadcast(new PaymentPaid(
                invoice:            $invoice,
                transaction:        $transaction,
                umkmUserId:         $umkmProfile->user_id,
                supplierUserId:     $supplierProfile->user_id,
                newSupplierBalance: (float) $supplierProfile->balance,
                netAmount:          $feeData['net_amount'],
                fee:                $feeData['fee'],
            ));
        } catch (\Throwable $e) {
            // Broadcast gagal tidak boleh menggagalkan respons webhook
            Log::warning('[Webhook] Broadcast gagal (non-fatal)', ['error' => $e->getMessage()]);
        }

        Log::info('[Webhook] Payment berhasil diproses', [
            'invoice_id'     => $invoice->id,
            'amount'         => $transaction->amount,
            'fee'            => $feeData['fee'],
            'net'            => $feeData['net_amount'],
            'supplier_id'    => $supplierProfile->id,
        ]);

        // Xendit butuh HTTP 200 untuk konfirmasi sukses
        return response()->json(['message' => 'Payment processed successfully'], 200);
    }
}

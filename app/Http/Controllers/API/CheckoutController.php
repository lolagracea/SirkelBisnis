<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\PaymentTransaction;
use App\Services\Payment\FeeCalculatorService;
use App\Services\Payment\XenditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * CheckoutController — Menangani inisiasi pembayaran QRIS / VA dari UMKM.
 *
 * Alur:
 *   1. UMKM POST /checkout/{invoiceId} dengan metode pembayaran
 *   2. Simpan PaymentTransaction (status: pending) + idempotency key
 *   3. Hit Xendit API untuk buat QRIS atau VA
 *   4. Simpan data QRIS/VA ke transaksi
 *   5. Return data ke React (qr_string / va_number)
 */
class CheckoutController extends Controller
{
    public function __construct(
        private readonly XenditService       $xendit,
        private readonly FeeCalculatorService $feeCalculator,
    ) {}

    /**
     * POST /api/invoices/{invoiceId}/checkout
     */
    public function checkout(Request $request, int $invoiceId): JsonResponse
    {
        $user = $request->user();

        // ── Validasi Input ─────────────────────────────────────────────
        $validated = $request->validate([
            'payment_method' => ['required', Rule::in(['QRIS', 'VA'])],
            'bank_code'      => [
                Rule::requiredIf($request->payment_method === 'VA'),
                Rule::in(array_keys(XenditService::supportedBanks())),
            ],
        ]);

        // ── Ambil & Validasi Invoice ───────────────────────────────────
        /** @var Invoice $invoice */
        $invoice = Invoice::with('order.buyer.umkmProfile')->findOrFail($invoiceId);

        // Pastikan invoice milik UMKM yang sedang login
        $umkmProfile = $user->umkmProfile;
        if (!$umkmProfile || $invoice->order->buyer_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice tidak ditemukan atau bukan milik Anda.',
            ], 403);
        }

        // Cegah pembayaran invoice yang sudah lunas
        if ($invoice->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Invoice ini sudah lunas.',
            ], 409);
        }

        // Idempotency: Cek apakah sudah ada transaksi pending untuk invoice ini
        $existingTx = $invoice->paymentTransactions()
            ->where('status', 'pending')
            ->where('payment_method', $validated['payment_method'])
            ->latest()
            ->first();

        if ($existingTx) {
            return response()->json([
                'success' => true,
                'message' => 'Transaksi pembayaran sedang menunggu konfirmasi.',
                'data'    => $this->formatTransactionResponse($existingTx),
            ]);
        }

        // ── Buat Idempotency Key ───────────────────────────────────────
        $idempotencyKey = 'INV-' . $invoiceId . '-' . Str::upper(Str::random(12));

        // ── Buat PaymentTransaction (status: pending) ─────────────────
        $transaction = PaymentTransaction::create([
            'invoice_id'      => $invoice->id,
            'payment_method'  => $validated['payment_method'],
            'bank_code'       => $validated['bank_code'] ?? null,
            'amount'          => $invoice->amount,
            'status'          => 'pending',
            'idempotency_key' => $idempotencyKey,
            'expired_at'      => now()->addHours(24),
        ]);

        // ── Hit Xendit API ─────────────────────────────────────────────
        try {
            if ($validated['payment_method'] === 'QRIS') {
                $xenditResponse = $this->xendit->createQris(
                    amount:      (float) $invoice->amount,
                    referenceId: $idempotencyKey,
                    description: "Pembayaran Invoice #{$invoice->id} - " . ($umkmProfile->business_name ?? $user->name),
                );

                $transaction->update([
                    'xendit_id'       => $xenditResponse['id'],
                    'qr_id'           => $xenditResponse['id'],
                    'qr_string'       => $xenditResponse['qr_string'],
                    'expired_at'      => isset($xenditResponse['expires_at'])
                        ? now()->parse($xenditResponse['expires_at'])
                        : now()->addMinutes(30),
                    'xendit_response' => $xenditResponse,
                ]);
            } else {
                $xenditResponse = $this->xendit->createVirtualAccount(
                    bankCode:    $validated['bank_code'],
                    amount:      (float) $invoice->amount,
                    referenceId: $idempotencyKey,
                    name:        $umkmProfile->business_name ?? $user->name,
                );

                $transaction->update([
                    'xendit_id'       => $xenditResponse['id'],
                    'va_number'       => $xenditResponse['account_number'],
                    'expired_at'      => isset($xenditResponse['expiration_date'])
                        ? now()->parse($xenditResponse['expiration_date'])
                        : now()->addHours(24),
                    'xendit_response' => $xenditResponse,
                ]);
            }
        } catch (\Exception $e) {
            // Jika Xendit gagal, tandai transaksi sebagai failed
            $transaction->update(['status' => 'failed']);

            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat pembayaran: ' . $e->getMessage(),
            ], 502);
        }

        // ── Update payment_method di Invoice ──────────────────────────
        $invoice->update([
            'payment_method' => $invoice->payment_term_days > 0 ? 'tempo' : 'cash',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran berhasil diinisiasi. Silakan selesaikan pembayaran.',
            'data'    => $this->formatTransactionResponse($transaction->fresh()),
        ], 201);
    }

    /**
     * GET /api/invoices/{invoiceId}/payment-status
     * Cek status transaksi terbaru untuk invoice (polling fallback).
     */
    public function status(Request $request, int $invoiceId): JsonResponse
    {
        $user    = $request->user();
        $invoice = Invoice::findOrFail($invoiceId);

        $user = $request->user();
        
        $umkmProfile = $user->umkmProfile;
        if (!$umkmProfile || $invoice->order->buyer_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $transaction = $invoice->paymentTransactions()->latest()->first();

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Belum ada transaksi untuk invoice ini.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $this->formatTransactionResponse($transaction),
        ]);
    }

    /**
     * Format data transaksi untuk response API.
     */
    private function formatTransactionResponse(PaymentTransaction $tx): array
    {
        return [
            'transaction_id'  => $tx->id,
            'payment_method'  => $tx->payment_method,
            'bank_code'       => $tx->bank_code,
            'amount'          => $tx->amount,
            'status'          => $tx->status,
            'qr_string'       => $tx->qr_string,
            'va_number'       => $tx->va_number,
            'idempotency_key' => $tx->idempotency_key,
            'expired_at'      => $tx->expired_at?->toIso8601String(),
            'paid_at'         => $tx->paid_at?->toIso8601String(),
            'is_mock'         => str_contains(config('services.xendit.secret_key', ''), 'REPLACE_ME') || empty(config('services.xendit.secret_key')),
        ];
    }

    /**
     * POST /api/invoices/{invoiceId}/simulate-payment
     * Endpoint untuk memicu webhook secara internal saat dalam mode Sandbox Mock.
     */
    public function simulatePayment(Request $request, int $invoiceId): JsonResponse
    {
        $user = $request->user();
        $invoice = Invoice::findOrFail($invoiceId);
        
        $transaction = $invoice->paymentTransactions()->where('status', 'pending')->latest()->first();
        if (!$transaction) {
            return response()->json(['success' => false, 'message' => 'Tidak ada transaksi pending.'], 404);
        }

        $webhookData = [
            'status' => $transaction->payment_method === 'QRIS' ? 'SUCCEEDED' : 'PAID',
            $transaction->payment_method === 'QRIS' ? 'reference_id' : 'external_id' => $transaction->idempotency_key,
            'id' => $transaction->xendit_id,
        ];

        $requestMock = Request::create(
            '/api/webhook/xendit/' . strtolower($transaction->payment_method),
            'POST',
            $webhookData
        );
        $requestMock->headers->set('x-callback-token', config('services.xendit.callback_token', ''));
        
        try {
            $webhookController = app()->make(\App\Http\Controllers\API\XenditWebhookController::class);
            $response = $transaction->payment_method === 'QRIS' 
                ? $webhookController->handleQris($requestMock)
                : $webhookController->handleVa($requestMock);

            if ($response->getStatusCode() === 200) {
                return response()->json(['success' => true, 'message' => 'Simulasi berhasil.']);
            }
            return response()->json(['success' => false, 'message' => 'Simulasi gagal dengan status ' . $response->getStatusCode()], 500);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Simulasi gagal karena error: ' . $e->getMessage()], 500);
        }
    }
}

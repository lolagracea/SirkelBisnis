<?php

namespace App\Services\Payment;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * XenditService — wrapper untuk Xendit Sandbox API.
 *
 * Mendukung:
 *   - QRIS (QR Code dari /qr_codes)
 *   - Virtual Account (dari /callback_virtual_accounts)
 *   - Validasi webhook token
 */
class XenditService
{
    protected string $secretKey;
    protected string $callbackToken;
    protected string $baseUrl = 'https://api.xendit.co';

    public function __construct()
    {
        $this->secretKey     = config('services.xendit.secret_key', '');
        $this->callbackToken = config('services.xendit.callback_token', '');
    }

    // ──────────────────────────────────────────────
    //  QRIS
    // ──────────────────────────────────────────────

    /**
     * Buat QRIS baru di Xendit.
     *
     * @param  float   $amount        Nominal pembayaran (IDR)
     * @param  string  $referenceId   ID unik transaksi (idempotency_key)
     * @param  string  $description   Keterangan pembayaran
     * @return array                  Response Xendit
     */
    public function createQris(float $amount, string $referenceId, string $description): array
    {
        if (str_contains($this->secretKey, 'REPLACE_ME') || empty($this->secretKey)) {
            Log::info('[XenditService] Mocking QRIS response due to missing/dummy API key', ['ref' => $referenceId]);
            return [
                'id' => 'qr_' . \Illuminate\Support\Str::random(10),
                'reference_id' => $referenceId,
                'qr_string' => '00020101021226570011ID.CO.QRS.WWW011893600911001123456702090000000005204541153033605404' . (int)$amount . '5802ID5912Mock UMKM6007Jakarta6105123456214011012345678906304ABCD',
                'amount' => (int) $amount,
                'status' => 'ACTIVE',
                'expires_at' => now()->addMinutes(30)->toIso8601String(),
            ];
        }

        $response = Http::withBasicAuth($this->secretKey, '')
            ->post("{$this->baseUrl}/qr_codes", [
                'reference_id' => $referenceId,
                'type'         => 'DYNAMIC',
                'currency'     => 'IDR',
                'amount'       => (int) $amount,
                'expires_at'   => now()->addMinutes(30)->toIso8601String(),
                'metadata'     => ['description' => $description],
            ]);

        if ($response->failed()) {
            Log::error('[XenditService] createQris failed', [
                'status'  => $response->status(),
                'body'    => $response->json(),
                'ref'     => $referenceId,
            ]);
            throw new \RuntimeException('Gagal membuat QRIS: ' . ($response->json('message') ?? 'Unknown error'));
        }

        return $response->json();
    }

    // ──────────────────────────────────────────────
    //  Virtual Account
    // ──────────────────────────────────────────────

    /**
     * Buat Virtual Account baru di Xendit.
     *
     * @param  string  $bankCode      Kode bank (BCA, MANDIRI, BNI, BRI, PERMATA, BSI)
     * @param  float   $amount        Nominal pembayaran (IDR)
     * @param  string  $referenceId   ID unik transaksi
     * @param  string  $name          Nama pemilik VA (nama UMKM)
     * @return array                  Response Xendit
     */
    public function createVirtualAccount(
        string $bankCode,
        float $amount,
        string $referenceId,
        string $name
    ): array {
        if (str_contains($this->secretKey, 'REPLACE_ME') || empty($this->secretKey)) {
            Log::info('[XenditService] Mocking VA response due to missing/dummy API key', ['ref' => $referenceId]);
            return [
                'id' => 'va_' . \Illuminate\Support\Str::random(10),
                'external_id' => $referenceId,
                'bank_code' => strtoupper($bankCode),
                'name' => $name,
                'account_number' => '8989' . rand(10000000, 99999999),
                'expected_amount' => (int) $amount,
                'status' => 'PENDING',
                'expiration_date' => now()->addHours(24)->toIso8601String(),
            ];
        }

        $response = Http::withBasicAuth($this->secretKey, '')
            ->post("{$this->baseUrl}/callback_virtual_accounts", [
                'external_id'        => $referenceId,
                'bank_code'          => strtoupper($bankCode),
                'name'               => $name,
                'expected_amount'    => (int) $amount,
                'expiration_date'    => now()->addHours(24)->toIso8601String(),
                'is_single_use'      => true, // Satu kali pakai agar lebih aman
                'is_closed'          => true, // Hanya terima amount yang tepat
            ]);

        if ($response->failed()) {
            Log::error('[XenditService] createVirtualAccount failed', [
                'status'    => $response->status(),
                'body'      => $response->json(),
                'bank_code' => $bankCode,
                'ref'       => $referenceId,
            ]);
            throw new \RuntimeException('Gagal membuat Virtual Account: ' . ($response->json('message') ?? 'Unknown error'));
        }

        return $response->json();
    }

    // ──────────────────────────────────────────────
    //  Webhook Validation
    // ──────────────────────────────────────────────

    /**
     * Validasi header x-callback-token dari Xendit.
     * Jika token tidak cocok, tolak webhook (return false).
     *
     * @param  string  $incomingToken  Token dari header request
     * @return bool
     */
    public function validateWebhookToken(string $incomingToken): bool
    {
        if (empty($this->callbackToken)) {
            // Jika belum di-set, skip validasi (development only!)
            Log::warning('[XenditService] XENDIT_CALLBACK_TOKEN not set, skipping validation');
            return true;
        }

        return hash_equals($this->callbackToken, $incomingToken);
    }

    /**
     * Ambil bank yang didukung untuk Virtual Account.
     */
    public static function supportedBanks(): array
    {
        return [
            'BCA'     => 'BCA',
            'MANDIRI' => 'Bank Mandiri',
            'BNI'     => 'BNI',
            'BRI'     => 'BRI',
            'PERMATA' => 'Bank Permata',
            'BSI'     => 'BSI (Bank Syariah Indonesia)',
        ];
    }
}

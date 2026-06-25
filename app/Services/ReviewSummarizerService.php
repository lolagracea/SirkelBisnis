<?php

namespace App\Services;

use App\Models\Review;
use App\Models\ReviewSummary;
use App\Models\SupplierProfile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ReviewSummarizerService
{
    /**
     * Call Gemini API to summarize reviews.
     *
     * @param SupplierProfile $supplier
     * @return array
     * @throws \Exception
     */
    public function summarizeReviews(SupplierProfile $supplier): array
    {
        $reviews = Review::where('supplier_id', $supplier->id)
            ->select('rating', 'comment')
            ->get();

        if ($reviews->isEmpty()) {
            return [
                'positive' => [],
                'negative' => [],
                'summary' => 'Belum ada review untuk supplier ini.',
            ];
        }

        // Format reviews as a compact JSON string to inject into prompt
        $reviewsJson = $reviews->toJson(JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        $apiKey = config('services.gemini.key');

        if (!$apiKey) {
            Log::error('Gemini API key is not configured.');
            throw new \Exception('Gemini API key is not configured.');
        }

        // Exact prompt request from prompt instructions
        $prompt = "Analyze the supplier reviews below.\n\nReturn JSON only.\n\nGenerate:\n\n1. Positive Highlights\n2. Negative Highlights\n3. Overall Summary\n\nReviews:\n" . $reviewsJson;

        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey;

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post($url, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                ]
            ]);

            if ($response->failed()) {
                Log::error('Gemini API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('Failed to communicate with Gemini API: Status ' . $response->status());
            }

            $data = $response->json();
            $responseText = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

            if (!$responseText) {
                Log::error('Invalid response structure from Gemini API', ['response' => $data]);
                throw new \Exception('Invalid response structure from Gemini API');
            }

            $decoded = json_decode($responseText, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Failed to parse Gemini response as JSON', [
                    'raw_text' => $responseText,
                    'error' => json_last_error_msg()
                ]);
                throw new \Exception('Failed to parse Gemini response as JSON');
            }

            // Normalise key names to: positive, negative, summary
            $positive = $decoded['positive'] ?? $decoded['positive_highlights'] ?? $decoded['positiveHighlights'] ?? [];
            $negative = $decoded['negative'] ?? $decoded['negative_highlights'] ?? $decoded['negativeHighlights'] ?? [];
            $summary = $decoded['summary'] ?? $decoded['overall_summary'] ?? $decoded['overallSummary'] ?? '';

            return [
                'positive' => is_array($positive) ? $positive : [$positive],
                'negative' => is_array($negative) ? $negative : [$negative],
                'summary' => (string) $summary,
            ];
        } catch (\Exception $e) {
            Log::error('Error occurred during review summarization', [
                'supplier_id' => $supplier->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Save the summarized reviews.
     *
     * @param SupplierProfile $supplier
     * @param array $summaryData
     * @return ReviewSummary
     */
    public function saveSummary(SupplierProfile $supplier, array $summaryData): ReviewSummary
    {
        return ReviewSummary::updateOrCreate(
            ['supplier_id' => $supplier->id],
            [
                'positive_points' => $summaryData['positive'] ?? [],
                'negative_points' => $summaryData['negative'] ?? [],
                'summary' => $summaryData['summary'] ?? '',
            ]
        );
    }
}

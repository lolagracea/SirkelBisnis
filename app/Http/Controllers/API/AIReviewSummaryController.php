<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\SupplierProfile;
use App\Services\ReviewSummarizerService;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIReviewSummaryController extends Controller
{
    protected ReviewSummarizerService $summarizerService;

    public function __construct(ReviewSummarizerService $summarizerService)
    {
        $this->summarizerService = $summarizerService;
    }

    /**
     * Display the AI-generated review summary for a specific supplier.
     *
     * @param int $supplierId
     * @return JsonResponse
     */
    public function show(int $supplierId): JsonResponse
    {
        try {
            $supplier = SupplierProfile::findOrFail($supplierId);

            // Fetch the latest review to determine cache freshness
            $latestReview = Review::where('supplier_id', $supplier->id)
                ->latest()
                ->first();

            // If there are no reviews, return a graceful empty state directly
            if (!$latestReview) {
                return response()->json([
                    'success' => true,
                    'message' => 'Belum ada review untuk supplier ini.',
                    'data' => [
                        'positive' => [],
                        'negative' => [],
                        'summary' => 'Belum ada review untuk supplier ini.',
                    ],
                ]);
            }

            // Check if there is an existing summary in the database
            $existingSummary = $supplier->reviewSummary;

            // Cache validation logic:
            // If we have an existing summary, and its updated_at is newer or equal to the latest review's updated_at/created_at
            if ($existingSummary && $existingSummary->updated_at->gte($latestReview->updated_at)) {
                return response()->json([
                    'success' => true,
                    'message' => 'AI Review summary retrieved from cache.',
                    'data' => [
                        'positive' => $existingSummary->positive_points,
                        'negative' => $existingSummary->negative_points,
                        'summary' => $existingSummary->summary,
                    ],
                ]);
            }

            // Otherwise (stale or doesn't exist), summarize and save
            $summaryData = $this->summarizerService->summarizeReviews($supplier);
            $newSummary = $this->summarizerService->saveSummary($supplier, $summaryData);

            return response()->json([
                'success' => true,
                'message' => 'AI Review summary generated successfully.',
                'data' => [
                    'positive' => $newSummary->positive_points,
                    'negative' => $newSummary->negative_points,
                    'summary' => $newSummary->summary,
                ],
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Supplier tidak ditemukan.',
                'data' => null,
            ], 404);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil ringkasan ulasan AI: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }
}

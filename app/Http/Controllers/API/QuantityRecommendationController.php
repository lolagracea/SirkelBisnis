<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\QuantityRecommendationService;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuantityRecommendationController extends Controller
{
    protected QuantityRecommendationService $recommendationService;

    public function __construct(QuantityRecommendationService $recommendationService)
    {
        $this->recommendationService = $recommendationService;
    }

    /**
     * Get the quantity recommendation metrics for the authenticated UMKM user.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // Business Rule: Only UMKM can view quantity recommendations
            if ($user->role !== 'umkm') {
                throw new AuthorizationException('Hanya pengguna dengan peran UMKM yang dapat mengakses rekomendasi kuantitas.');
            }

            // Retrieve current stock from query parameters (default to 0)
            $currentStock = $request->query('current_stock');
            $currentStock = $currentStock !== null ? max(0, (int) $currentStock) : 0;

            // Compute ideal recommendations
            $data = $this->recommendationService->recommendQuantity($user, $currentStock);

            return response()->json([
                'success' => true,
                'message' => 'Quantity recommendation calculated successfully.',
                'data' => [
                    'recommended_quantity' => $data['recommended_quantity'],
                    'minimum_safe_quantity' => $data['minimum_safe_quantity'],
                    'maximum_safe_quantity' => $data['maximum_safe_quantity'],
                ],
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 403);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghitung rekomendasi kuantitas: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }
}

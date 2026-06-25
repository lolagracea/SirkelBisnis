<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\RestockPredictionService;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RestockPredictionController extends Controller
{
    protected RestockPredictionService $restockService;

    public function __construct(RestockPredictionService $restockService)
    {
        $this->restockService = $restockService;
    }

    /**
     * Get the restock prediction metrics for the authenticated UMKM user.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // Business Rule: Only UMKM can view restock predictions
            if ($user->role !== 'umkm') {
                throw new AuthorizationException('Hanya pengguna dengan peran UMKM yang dapat mengakses prediksi restock.');
            }

            // Retrieve current stock from query parameters (default to 0)
            $currentStock = $request->query('current_stock');
            $currentStock = $currentStock !== null ? max(0, (int) $currentStock) : 0;

            // 1. Calculate consumption baseline
            $baseline = $this->restockService->calculateConsumptionRate($user);

            // 2. Predict restock date and remaining days
            $prediction = $this->restockService->predictRestockDate($user, $currentStock, $baseline);

            // 3. Predict recommended quantity
            $recommendedQty = $this->restockService->predictQuantity($user, $baseline);

            // 4. Resolve status indicator
            $daysRemaining = $prediction['days_remaining'];
            if ($daysRemaining <= 2) {
                $status = 'restock_now';
            } elseif ($daysRemaining <= 7) {
                $status = 'restock_soon';
            } else {
                $status = 'safe';
            }

            return response()->json([
                'success' => true,
                'message' => 'Restock prediction calculated successfully.',
                'data' => [
                    'estimated_restock_date' => $prediction['estimated_restock_date'],
                    'days_remaining' => $daysRemaining,
                    'recommended_quantity' => $recommendedQty,
                    'status' => $status,
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
                'message' => 'Gagal menghitung prediksi restock: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }
}

<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\SirkelScoreResource;
use App\Models\SupplierProfile;
use App\Services\SirkelScoreService;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SirkelScoreController extends Controller
{
    protected SirkelScoreService $sirkelScoreService;

    public function __construct(SirkelScoreService $sirkelScoreService)
    {
        $this->sirkelScoreService = $sirkelScoreService;
    }

    /**
     * Display the SirkelScore details and breakdown for a supplier.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $supplier = SupplierProfile::findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'SirkelScore retrieved successfully.',
                'data' => new SirkelScoreResource($supplier),
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
                'message' => 'Gagal mengambil SirkelScore: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Recalculate SirkelScore for all suppliers. Admin only.
     */
    public function recalculate(Request $request): JsonResponse
    {
        try {
            // Business Rule: Admin only
            if ($request->user()->role !== 'admin') {
                throw new AuthorizationException('Hanya admin yang dapat memicu kalkulasi ulang semua skor.');
            }

            $this->sirkelScoreService->recalculateAllSuppliers();

            return response()->json([
                'success' => true,
                'message' => 'All supplier scores recalculated successfully.',
                'data' => null,
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
                'message' => 'Gagal mengkalkulasi ulang skor: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }
}

<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\PriceAnalysisService;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PriceAnalysisController extends Controller
{
    protected PriceAnalysisService $priceService;

    public function __construct(PriceAnalysisService $priceService)
    {
        $this->priceService = $priceService;
    }

    /**
     * Get the price analysis metrics for a specific product.
     *
     * @param int $productId
     * @return JsonResponse
     */
    public function show(int $productId): JsonResponse
    {
        try {
            $product = Product::findOrFail($productId);

            // Calculate price intelligence insight
            $data = $this->priceService->generateInsight($product);

            return response()->json([
                'success' => true,
                'message' => 'Price analysis calculated successfully.',
                'data' => [
                    'status' => $data['status'],
                    'difference_percentage' => $data['difference_percentage'],
                    'market_average' => $data['market_average'],
                    'current_price' => $data['current_price'],
                    'summary' => $data['summary'],
                ],
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
                'data' => null,
            ], 404);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menganalisis harga produk: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }
}

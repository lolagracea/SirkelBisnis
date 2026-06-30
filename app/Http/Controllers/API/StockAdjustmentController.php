<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockAdjustmentController extends Controller
{
    public function store(Request $request, int $productId): JsonResponse
    {
        $request->validate([
            'change_amount' => 'required|integer',
            'reason' => 'required|string|max:255',
        ]);

        $product = Product::findOrFail($productId);

        if (auth()->check() && !auth()->user()->isRole('admin')) {
            $userSupplierProfile = auth()->user()->supplierProfile;
            if (!$userSupplierProfile || $userSupplierProfile->id !== (int) $product->supplier_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized action.',
                    'data' => null
                ], 403);
            }
        }

        try {
            DB::beginTransaction();

            $product->stock += $request->input('change_amount');
            $product->save();

            DB::table('stock_ledgers')->insert([
                'product_id' => $product->id,
                'change_amount' => $request->input('change_amount'),
                'reason' => $request->input('reason'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Stock adjusted successfully',
                'data' => [
                    'new_stock' => $product->stock
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to adjust stock: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }
}

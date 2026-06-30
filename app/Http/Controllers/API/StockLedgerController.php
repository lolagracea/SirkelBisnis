<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\StockLedger;
use App\Models\Product;

class StockLedgerController extends Controller
{
    public function getByProduct(Request $request, $productId)
    {
        $supplier = $request->user()->supplierProfile;
        if (!$supplier) {
            return response()->json(['success' => false, 'message' => 'Not a supplier'], 403);
        }

        $product = Product::where('id', $productId)->where('supplier_id', $supplier->id)->first();
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan'], 404);
        }

        $ledgers = StockLedger::where('product_id', $productId)->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $ledgers
        ]);
    }
}

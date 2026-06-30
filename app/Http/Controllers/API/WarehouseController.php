<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use App\Models\Product;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function index(Request $request)
    {
        $warehouses = Warehouse::where('supplier_id', $request->user()->supplier_profile->id)->get();
        return response()->json($warehouses);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'city_id' => 'required|exists:cities,id',
            'address' => 'required|string'
        ]);

        $warehouse = Warehouse::create([
            'supplier_id' => $request->user()->supplier_profile->id,
            'name' => $validated['name'],
            'city_id' => $validated['city_id'],
            'address' => $validated['address']
        ]);

        return response()->json($warehouse, 201);
    }

    public function destroy(Request $request, $id)
    {
        $warehouse = Warehouse::where('supplier_id', $request->user()->supplier_profile->id)->findOrFail($id);
        $warehouse->delete();
        return response()->json(['message' => 'Warehouse deleted']);
    }

    // UMKM melihat ketersediaan stok produk tertentu di tiap gudang supplier (untuk estimasi waktu kirim)
    public function stockByProduct(Request $request, $productId)
    {
        $product = Product::findOrFail($productId);

        $warehouses = Warehouse::where('supplier_id', $product->supplier_id)
            ->with('city')
            ->withPivot('stock') // asumsi relasi many-to-many product_warehouse dengan kolom stock
            ->get();

        // Jika relasi product<->warehouse via tabel product_warehouse (sudah ada di migration project Anda)
        $stockPerWarehouse = $product->warehouses()
            ->withPivot('stock')
            ->with('city')
            ->get()
            ->map(fn ($w) => [
                'warehouse_id' => $w->id,
                'warehouse_name' => $w->name,
                'city' => $w->city?->name,
                'stock' => $w->pivot->stock ?? 0,
            ]);

        return response()->json($stockPerWarehouse);
    }
}

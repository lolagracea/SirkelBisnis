<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
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
}

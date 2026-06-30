<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\SponsoredProduct;
use Illuminate\Http\Request;

class SponsoredProductController extends Controller
{
    public function index(Request $request)
    {
        $sponsored = SponsoredProduct::with('product')
            ->where('supplier_id', $request->user()->supplier_profile->id)
            ->get();
        return response()->json($sponsored);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'cpc_bid' => 'required|numeric',
            'daily_budget' => 'required|numeric',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date'
        ]);

        $sponsored = SponsoredProduct::create([
            'supplier_id' => $request->user()->supplier_profile->id,
            'product_id' => $validated['product_id'],
            'cpc_bid' => $validated['cpc_bid'],
            'daily_budget' => $validated['daily_budget'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'] ?? null
        ]);

        return response()->json($sponsored, 201);
    }
}

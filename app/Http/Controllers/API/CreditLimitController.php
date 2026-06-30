<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\CreditLimit;
use Illuminate\Http\Request;

class CreditLimitController extends Controller
{
    public function index(Request $request)
    {
        $limits = CreditLimit::with('umkm.user')
            ->where('supplier_id', $request->user()->supplier_profile->id)
            ->get();
        return response()->json($limits);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'umkm_id' => 'required|exists:umkm_profiles,id',
            'limit_amount' => 'required|numeric',
            'term_days' => 'required|integer'
        ]);

        $limit = CreditLimit::updateOrCreate(
            ['supplier_id' => $request->user()->supplier_profile->id, 'umkm_id' => $validated['umkm_id']],
            ['limit_amount' => $validated['limit_amount'], 'term_days' => $validated['term_days']]
        );

        return response()->json($limit, 201);
    }
}

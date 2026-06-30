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

    // UMKM melihat limit kredit dari semua supplier yang sudah memberinya kredit
    public function umkmIndex(Request $request)
    {
        $limits = CreditLimit::with('supplier.user')
            ->where('umkm_id', $request->user()->umkm_profile->id)
            ->get()
            ->map(function ($limit) {
                return [
                    'id' => $limit->id,
                    'supplier_name' => $limit->supplier?->business_name ?? $limit->supplier?->user?->name,
                    'limit_amount' => $limit->limit_amount,
                    'used_amount' => $limit->used_amount,
                    'available_amount' => max(0, $limit->limit_amount - $limit->used_amount),
                    'term_days' => $limit->term_days,
                ];
            });

        return response()->json($limits);
    }

    // UMKM melihat limit kredit dari satu supplier spesifik (untuk ditampilkan saat checkout)
    public function umkmShowForSupplier(Request $request, $supplierId)
    {
        $limit = CreditLimit::where('supplier_id', $supplierId)
            ->where('umkm_id', $request->user()->umkm_profile->id)
            ->first();

        if (!$limit) {
            return response()->json(['has_credit' => false]);
        }

        return response()->json([
            'has_credit' => true,
            'limit_amount' => $limit->limit_amount,
            'used_amount' => $limit->used_amount,
            'available_amount' => max(0, $limit->limit_amount - $limit->used_amount),
            'term_days' => $limit->term_days,
        ]);
    }
}

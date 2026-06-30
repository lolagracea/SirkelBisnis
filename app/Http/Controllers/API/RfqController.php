<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Rfq;
use App\Models\RfqOffer;
use Illuminate\Http\Request;

class RfqController extends Controller
{
    public function supplierIndex(Request $request)
    {
        $rfqs = Rfq::with(['umkm.user', 'items.product', 'offers'])
            ->where('supplier_id', $request->user()->supplier_profile->id)
            ->get();
        return response()->json($rfqs);
    }

    public function umkmIndex(Request $request)
    {
        $rfqs = Rfq::with(['supplier.user', 'items.product', 'offers'])
            ->where('umkm_id', $request->user()->umkm_profile->id)
            ->get();
        return response()->json($rfqs);
    }

    public function storeOffer(Request $request, $rfqId)
    {
        $validated = $request->validate([
            'supplier_price' => 'required|numeric',
            'note' => 'nullable|string'
        ]);

        $rfq = Rfq::where('supplier_id', $request->user()->supplier_profile->id)->findOrFail($rfqId);
        
        $offer = RfqOffer::create([
            'rfq_id' => $rfq->id,
            'supplier_price' => $validated['supplier_price'],
            'note' => $validated['note'] ?? ''
        ]);

        $rfq->update(['status' => 'negotiated']);

        return response()->json($offer, 201);
    }
}

<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Rfq;
use App\Models\RfqOffer;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\RfqItem;
use Illuminate\Support\Facades\DB;

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

    // UMKM membuat permintaan penawaran (RFQ) ke supplier, bisa multi-item
    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:supplier_profiles,id',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.target_price' => 'nullable|numeric|min:0',
        ]);

        $rfq = DB::transaction(function () use ($validated, $request) {
            $rfq = Rfq::create([
                'umkm_id' => $request->user()->umkm_profile->id,
                'supplier_id' => $validated['supplier_id'],
                'status' => 'pending',
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $rfq->items()->create($item);
            }

            return $rfq;
        });

        return response()->json($rfq->load('items.product'), 201);
    }

    // UMKM menerima penawaran harga dari supplier dan langsung membentuk Order
    public function acceptOffer(Request $request, $offerId)
    {
        $offer = RfqOffer::with('rfq.items')->findOrFail($offerId);
        $rfq = $offer->rfq;

        abort_unless($rfq->umkm_id === $request->user()->umkm_profile->id, 403);
        abort_unless($rfq->status === 'negotiated', 422, 'Penawaran tidak lagi berlaku.');

        $orders = DB::transaction(function () use ($rfq, $offer, $request) {
            $createdOrders = [];

            foreach ($rfq->items as $item) {
                $createdOrders[] = Order::create([
                    'order_code' => 'RFQ-' . strtoupper(uniqid()),
                    'buyer_id' => $request->user()->id,
                    'supplier_id' => $rfq->supplier_id,
                    'product_id' => $item->product_id,
                    'quantity' => $item->qty,
                    'unit_price' => $offer->supplier_price,
                    'total_price' => $offer->supplier_price * $item->qty,
                    'type' => 'rfq',
                    'status' => 'pending',
                    'payment_status' => 'unpaid',
                    'notes' => 'Dibuat dari RFQ #' . $rfq->id,
                ]);
            }

            $rfq->update(['status' => 'accepted']);

            return $createdOrders;
        });

        return response()->json(['rfq' => $rfq, 'orders' => $orders], 201);
    }

    // UMKM membatalkan RFQ yang belum ditawar
    public function cancel(Request $request, $id)
    {
        $rfq = Rfq::where('umkm_id', $request->user()->umkm_profile->id)->findOrFail($id);
        abort_unless($rfq->status === 'pending', 422, 'RFQ yang sudah ditawar tidak bisa dibatalkan.');

        $rfq->update(['status' => 'cancelled']);
        return response()->json($rfq);
    }

}

<?php

namespace App\Http\Controllers\Api\Supplier;

use App\Http\Controllers\Controller;
use App\Models\ReturnRequest;
use App\Models\Order;
use Illuminate\Http\Request;

class ReturnRequestController extends Controller
{
    public function index(Request $request)
    {
        $supplierId = $request->user()->supplierProfile->id ?? $request->user()->supplier_id;

        $returns = ReturnRequest::whereHas('order', function($q) use ($supplierId) {
            $q->where('supplier_id', $supplierId);
        })->with('order.product')->get();

        return response()->json([
            'status' => 'success',
            'data' => $returns
        ]);
    }

    public function store(Request $request)
    {
        // UMKM creates return request
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'reason' => 'required|string',
        ]);

        $order = Order::findOrFail($request->order_id);
        if ($order->buyer_id !== $request->user()->id) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        $returnReq = ReturnRequest::create([
            'order_id' => $order->id,
            'reason' => $request->reason,
            'status' => 'pending',
            'refund_amount' => $order->total_price,
        ]);

        return response()->json(['status' => 'success', 'data' => $returnReq], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $supplierId = $request->user()->supplierProfile->id ?? $request->user()->supplier_id;
        
        $returnReq = ReturnRequest::whereHas('order', function($q) use ($supplierId) {
            $q->where('supplier_id', $supplierId);
        })->findOrFail($id);

        $request->validate([
            'status' => 'required|in:approved,received,refunded,rejected',
        ]);

        $returnReq->update(['status' => $request->status]);

        return response()->json(['status' => 'success', 'data' => $returnReq]);
    }
}

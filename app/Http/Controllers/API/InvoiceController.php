<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Invoice;
use App\Models\Order;

class InvoiceController extends Controller
{
    public function index(): JsonResponse
    {
        $user = auth()->user();
        $query = Invoice::with(['order.product']);

        if ($user->isRole('umkm')) {
            $query->whereHas('order', function ($q) use ($user) {
                $q->where('umkm_id', $user->umkmProfile->id);
            });
        } else if ($user->isRole('supplier')) {
            $query->whereHas('order.product', function ($q) use ($user) {
                $q->where('supplier_id', $user->supplierProfile->id);
            });
        }

        return response()->json([
            'success' => true,
            'data' => $query->get()
        ]);
    }

    public function show($id): JsonResponse
    {
        $invoice = Invoice::with(['order.product', 'order.umkmProfile'])->findOrFail($id);
        return response()->json([
            'success' => true,
            'data' => $invoice
        ]);
    }

    public function pay($id): JsonResponse
    {
        $invoice = Invoice::findOrFail($id);
        $user = auth()->user();

        if (!$user->isRole('umkm') || $invoice->order->umkm_id !== $user->umkmProfile->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        // Logic for payment via wallet or dummy
        $invoice->update(['status' => 'paid']);
        $invoice->order->update(['payment_status' => 'paid']);

        return response()->json([
            'success' => true,
            'message' => 'Invoice paid successfully',
            'data' => $invoice
        ]);
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:unpaid,paid,overdue'
        ]);

        $invoice = Invoice::findOrFail($id);
        
        // Ensure user is the supplier who owns the order product
        $user = auth()->user();
        if (!$user->isRole('supplier') || $invoice->order->product->supplier_id !== $user->supplierProfile->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $invoice->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'Invoice status updated',
            'data' => $invoice
        ]);
    }
}

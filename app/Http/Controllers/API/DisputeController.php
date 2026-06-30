<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Dispute;
use App\Models\Order;

class DisputeController extends Controller
{
    public function index(): JsonResponse
    {
        $user = auth()->user();
        $query = Dispute::with(['order.product']);

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

    public function store(Request $request, $orderId): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string',
            'description' => 'nullable|string',
            'evidence_image' => 'nullable|image'
        ]);

        $order = Order::findOrFail($orderId);
        $user = auth()->user();

        if (!$user->isRole('umkm') || $order->umkm_id !== $user->umkmProfile->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $data = $request->only(['reason', 'description']);
        
        if ($request->hasFile('evidence_image')) {
            $path = $request->file('evidence_image')->store('disputes', 'public');
            $data['evidence_image'] = '/storage/' . $path;
        }

        $dispute = $order->dispute()->create($data);

        return response()->json([
            'success' => true,
            'message' => 'Dispute created',
            'data' => $dispute
        ]);
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:approved,rejected,resolved'
        ]);

        $dispute = Dispute::findOrFail($id);
        
        $user = auth()->user();
        if (!$user->isRole('supplier') || $dispute->order->product->supplier_id !== $user->supplierProfile->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $dispute->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'Dispute status updated',
            'data' => $dispute
        ]);
    }
}

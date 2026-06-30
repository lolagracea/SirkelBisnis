<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Voucher;
use App\Models\Order;

class VoucherController extends Controller
{
    public function index(): JsonResponse
    {
        $user = auth()->user();
        if (!$user->isRole('supplier')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $vouchers = Voucher::where('supplier_id', $user->supplierProfile->id)->get();
        return response()->json([
            'success' => true,
            'data' => $vouchers
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (!$user->isRole('supplier')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'code' => 'required|string|unique:vouchers,code',
            'type' => 'required|in:fixed,percentage',
            'value' => 'required|numeric|min:0',
            'min_purchase' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'quota' => 'required|integer|min:1',
            'valid_until' => 'required|date|after:today',
        ]);

        $data = $request->all();
        $data['supplier_id'] = $user->supplierProfile->id;

        $voucher = Voucher::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Voucher created',
            'data' => $voucher
        ], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $user = auth()->user();
        $voucher = Voucher::findOrFail($id);

        if (!$user->isRole('supplier') || $voucher->supplier_id !== $user->supplierProfile->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'type' => 'sometimes|in:fixed,percentage',
            'value' => 'sometimes|numeric|min:0',
            'min_purchase' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'quota' => 'sometimes|integer|min:1',
            'valid_until' => 'sometimes|date',
        ]);

        $voucher->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Voucher updated',
            'data' => $voucher
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $user = auth()->user();
        $voucher = Voucher::findOrFail($id);

        if (!$user->isRole('supplier') || $voucher->supplier_id !== $user->supplierProfile->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $voucher->delete();

        return response()->json([
            'success' => true,
            'message' => 'Voucher deleted'
        ]);
    }

    public function apply(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string',
            'order_id' => 'required|exists:orders,id'
        ]);

        $voucher = Voucher::where('code', $request->code)->first();
        if (!$voucher) {
            return response()->json(['success' => false, 'message' => 'Voucher not found'], 404);
        }

        if ($voucher->valid_until < now() || $voucher->used_count >= $voucher->quota) {
            return response()->json(['success' => false, 'message' => 'Voucher invalid or exhausted'], 400);
        }

        $order = Order::findOrFail($request->order_id);
        
        if ($order->product->supplier_id !== $voucher->supplier_id) {
            return response()->json(['success' => false, 'message' => 'Voucher not applicable for this supplier'], 400);
        }

        if ($voucher->min_purchase && $order->total_price < $voucher->min_purchase) {
            return response()->json(['success' => false, 'message' => 'Minimum purchase not met'], 400);
        }

        $discount = 0;
        if ($voucher->type === 'fixed') {
            $discount = $voucher->value;
        } else {
            $discount = $order->total_price * ($voucher->value / 100);
            if ($voucher->max_discount && $discount > $voucher->max_discount) {
                $discount = $voucher->max_discount;
            }
        }

        $order->update([
            'voucher_id' => $voucher->id,
            'discount_amount' => $discount,
            'total_price' => max(0, $order->total_price - $discount)
        ]);

        $voucher->increment('used_count');

        return response()->json([
            'success' => true,
            'message' => 'Voucher applied',
            'data' => $order
        ]);
    }
}

<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    protected OrderService $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            if (!$request->user()->hasRole('admin')) {
                throw new AuthorizationException('Hanya admin yang dapat melihat semua pesanan.');
            }

            $orders = Order::with(['buyer', 'supplier', 'product', 'groupBuying', 'invoice'])->get();

            return response()->json([
                'success' => true,
                'message' => 'Semua pesanan berhasil diambil.',
                'data'    => OrderResource::collection($orders),
            ]);
        } catch (AuthorizationException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'data' => null], 403);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengambil pesanan: ' . $e->getMessage(), 'data' => null], 500);
        }
    }

    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $order = Order::with(['buyer', 'supplier', 'product', 'groupBuying', 'invoice'])->findOrFail($id);

            $isAdmin    = $request->user()->hasRole('admin');
            $isBuyer    = $order->buyer_id === $request->user()->id;
            $isSupplier = $order->supplier && $order->supplier->user_id === $request->user()->id;

            if (!$isAdmin && !$isBuyer && !$isSupplier) {
                throw new AuthorizationException('Anda tidak memiliki wewenang untuk melihat detail pesanan ini.');
            }

            return response()->json([
                'success' => true,
                'message' => 'Detail pesanan berhasil diambil.',
                'data'    => new OrderResource($order),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.', 'data' => null], 404);
        } catch (AuthorizationException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'data' => null], 403);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengambil detail pesanan: ' . $e->getMessage(), 'data' => null], 500);
        }
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        try {
            // Middleware route sudah jaga, ini sebagai safety net
            if (!$request->user()->hasRole('umkm')) {
                throw new AuthorizationException('Hanya pengguna UMKM yang dapat membuat pesanan.');
            }

            $order = $this->orderService->createOrder($request->user(), $request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dibuat.',
                'data'    => new OrderResource($order->load(['buyer', 'supplier', 'product'])),
            ], 201);
        } catch (AuthorizationException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'data' => null], 403);
        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Validasi gagal.', 'errors' => $e->errors()], 422);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal membuat pesanan: ' . $e->getMessage(), 'data' => null], 500);
        }
    }

    public function myOrders(Request $request): JsonResponse
    {
        try {
            if (!$request->user()->hasRole('umkm')) {
                throw new AuthorizationException('Hanya pengguna UMKM yang dapat melihat pesanan mereka.');
            }

            $orders = Order::with(['buyer', 'supplier', 'product', 'groupBuying', 'invoice'])
                ->where('buyer_id', $request->user()->id)
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Pesanan Anda berhasil diambil.',
                'data'    => OrderResource::collection($orders),
            ]);
        } catch (AuthorizationException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'data' => null], 403);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengambil pesanan: ' . $e->getMessage(), 'data' => null], 500);
        }
    }

    public function supplierOrders(Request $request): JsonResponse
    {
        try {
            if (!$request->user()->hasRole('supplier')) {
                throw new AuthorizationException('Hanya supplier yang dapat mengakses daftar pesanan ini.');
            }

            $supplierProfile = $request->user()->supplierProfile;

            if (!$supplierProfile) {
                return response()->json(['success' => false, 'message' => 'Profil supplier tidak ditemukan.', 'data' => null], 404);
            }

            $orders = Order::with(['buyer', 'supplier', 'product', 'groupBuying'])
                ->where('supplier_id', $supplierProfile->id)
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Pesanan masuk supplier berhasil diambil.',
                'data'    => OrderResource::collection($orders),
            ]);
        } catch (AuthorizationException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'data' => null], 403);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengambil pesanan masuk: ' . $e->getMessage(), 'data' => null], 500);
        }
    }

    public function updateStatus(UpdateOrderStatusRequest $request, int $id): JsonResponse
    {
        try {
            $order = Order::findOrFail($id);

            // Cek relasi object — ini memang tidak bisa digantikan Spatie
            // karena butuh tahu apakah supplier ini punya relasi ke order ini
            $isSupplierOfOrder = $order->supplier && $order->supplier->user_id === $request->user()->id;

            if (!$isSupplierOfOrder) {
                throw new AuthorizationException('Hanya supplier penerima pesanan yang dapat memperbarui status.');
            }

            $updatedOrder = $this->orderService->updateStatus($request->user(), $order, $request->status);
            $extraData = $request->only(['shipping_courier', 'tracking_number']);
            $updatedOrder = $this->orderService->updateStatus(
                $request->user(),
                $order,
                $request->status,
                $extraData
            );

            return response()->json([
                'success' => true,
                'message' => 'Status pesanan berhasil diperbarui.',
                'data'    => new OrderResource($updatedOrder->load(['buyer', 'supplier', 'product'])),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.', 'data' => null], 404);
        } catch (AuthorizationException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'data' => null], 403);
        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Validasi gagal.', 'errors' => $e->errors()], 422);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal memperbarui status: ' . $e->getMessage(), 'data' => null], 500);
        }
    }

    public function updatePayment(Request $request, int $id): JsonResponse
    {
        try {
            $order = Order::findOrFail($id);

            $isAdmin           = $request->user()->hasRole('admin');
            $isSupplierOfOrder = $order->supplier && $order->supplier->user_id === $request->user()->id;

            // Buyer sengaja tidak diizinkan — mencegah self-mark paid
            if (!$isAdmin && !$isSupplierOfOrder) {
                throw new AuthorizationException('Anda tidak memiliki wewenang untuk memperbarui pembayaran pesanan ini.');
            }

            $paymentStatus = $request->input('payment_status', 'paid');
            $updatedOrder  = $this->orderService->updatePaymentStatus($order, $paymentStatus);

            return response()->json([
                'success' => true,
                'message' => 'Status pembayaran berhasil diperbarui.',
                'data'    => new OrderResource($updatedOrder->load(['buyer', 'supplier', 'product'])),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.', 'data' => null], 404);
        } catch (AuthorizationException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'data' => null], 403);
        } catch (ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Validasi gagal.', 'errors' => $e->errors()], 422);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal memperbarui pembayaran: ' . $e->getMessage(), 'data' => null], 500);
        }
    }

    public function bulkUpdateStatus(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'order_ids' => 'required|array',
                'order_ids.*' => 'integer|exists:orders,id',
                'status' => 'required|string',
            ]);

            $supplierProfile = $request->user()->supplierProfile;
            $supplierId = $supplierProfile ? $supplierProfile->id : $request->user()->supplier_id;
            
            $orders = Order::whereIn('id', $request->order_ids)
                ->where('supplier_id', $supplierId)
                ->get();

            foreach ($orders as $order) {
                $this->orderService->updateStatus($request->user(), $order, $request->status);
            }

            return response()->json([
                'success' => true,
                'message' => 'Bulk update successful',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bulk update failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}

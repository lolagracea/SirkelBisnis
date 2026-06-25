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

    /**
     * Display a listing of all orders. Admin only.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Business Rule: Admin can see all
            if ($request->user()->role !== 'admin') {
                throw new AuthorizationException('Hanya admin yang dapat melihat semua pesanan.');
            }

            $orders = Order::with(['buyer', 'supplier', 'product', 'groupBuying'])->get();

            return response()->json([
                'success' => true,
                'message' => 'Semua pesanan berhasil diambil.',
                'data' => OrderResource::collection($orders),
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 403);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil pesanan: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Display the detailed information of a specific order.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $order = Order::with(['buyer', 'supplier', 'product', 'groupBuying'])->findOrFail($id);

            // Authorization: Admin, Buyer, or Supplier of the order
            $isBuyer = $order->buyer_id === $request->user()->id;
            $isSupplier = $order->supplier && $order->supplier->user_id === $request->user()->id;
            $isAdmin = $request->user()->role === 'admin';

            if (!$isBuyer && !$isSupplier && !$isAdmin) {
                throw new AuthorizationException('Anda tidak memiliki wewenang untuk melihat detail pesanan ini.');
            }

            return response()->json([
                'success' => true,
                'message' => 'Detail pesanan berhasil diambil.',
                'data' => new OrderResource($order),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.',
                'data' => null,
            ], 404);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 403);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil detail pesanan: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Store a newly created order (Single purchase). Only UMKM can create.
     */
    public function store(StoreOrderRequest $request): JsonResponse
    {
        try {
            $order = $this->orderService->createOrder(
                $request->user(),
                $request->validated()
            );

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully',
                'data' => new OrderResource($order->load(['buyer', 'supplier', 'product'])),
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error.',
                'errors' => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat pesanan: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Display a listing of orders created by the logged in UMKM user.
     */
    public function myOrders(Request $request): JsonResponse
    {
        try {
            if ($request->user()->role !== 'umkm') {
                throw new AuthorizationException('Hanya pengguna dengan peran UMKM yang dapat melihat daftar pesanan mereka.');
            }

            $orders = Order::with(['buyer', 'supplier', 'product', 'groupBuying'])
                ->where('buyer_id', $request->user()->id)
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Pesanan Anda berhasil diambil.',
                'data' => OrderResource::collection($orders),
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 403);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil pesanan Anda: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Display a listing of orders received by the logged in supplier.
     */
    public function supplierOrders(Request $request): JsonResponse
    {
        try {
            $supplierProfile = $request->user()->supplierProfile;

            if ($request->user()->role !== 'supplier' || !$supplierProfile) {
                throw new AuthorizationException('Hanya supplier yang dapat mengakses daftar pesanan supplier.');
            }

            $orders = Order::with(['buyer', 'supplier', 'product', 'groupBuying'])
                ->where('supplier_id', $supplierProfile->id)
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Pesanan masuk supplier berhasil diambil.',
                'data' => OrderResource::collection($orders),
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 403);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil pesanan masuk supplier: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Update the status of the order. Only supplier can update.
     */
    public function updateStatus(UpdateOrderStatusRequest $request, int $id): JsonResponse
    {
        try {
            $order = Order::findOrFail($id);

            $updatedOrder = $this->orderService->updateStatus(
                $request->user(),
                $order,
                $request->status
            );

            return response()->json([
                'success' => true,
                'message' => 'Status pesanan berhasil diperbarui.',
                'data' => new OrderResource($updatedOrder->load(['buyer', 'supplier', 'product'])),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.',
                'data' => null,
            ], 404);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 403);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error.',
                'errors' => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui status pesanan: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Update the payment status of the order.
     */
    public function updatePayment(Request $request, int $id): JsonResponse
    {
        try {
            $order = Order::findOrFail($id);

            // Authorization: only Buyer, Admin, or receiving Supplier can update payment status
            $isBuyer = $order->buyer_id === $request->user()->id;
            $isSupplier = $order->supplier && $order->supplier->user_id === $request->user()->id;
            $isAdmin = $request->user()->role === 'admin';

            if (!$isBuyer && !$isSupplier && !$isAdmin) {
                throw new AuthorizationException('Anda tidak memiliki wewenang untuk memperbarui pembayaran pesanan ini.');
            }

            $paymentStatus = $request->input('payment_status', 'paid');
            $updatedOrder = $this->orderService->updatePaymentStatus($order, $paymentStatus);

            return response()->json([
                'success' => true,
                'message' => 'Status pembayaran berhasil diperbarui.',
                'data' => new OrderResource($updatedOrder->load(['buyer', 'supplier', 'product'])),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.',
                'data' => null,
            ], 404);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 403);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error.',
                'errors' => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui pembayaran pesanan: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }
}

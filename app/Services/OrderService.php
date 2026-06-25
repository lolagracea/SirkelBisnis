<?php

namespace App\Services;

use App\Models\GroupBuying;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    /**
     * Create a single purchase order directly by UMKM.
     */
    public function createOrder(User $buyer, array $data): Order
    {
        // Business Rule: Only UMKM can create orders
        if ($buyer->role !== 'umkm') {
            throw ValidationException::withMessages([
                'buyer' => ['Hanya pengguna dengan peran UMKM yang dapat membuat pesanan.'],
            ]);
        }

        $product = Product::findOrFail($data['product_id']);
        $quantity = (int) $data['quantity'];
        $unitPrice = $product->price;
        $totalPrice = $quantity * $unitPrice;
        $supplierId = $product->supplier_id; // references supplier_profiles.id

        return DB::transaction(function () use ($buyer, $product, $quantity, $unitPrice, $totalPrice, $supplierId, $data) {
            $orderCode = $this->generateOrderCode();

            return Order::create([
                'order_code' => $orderCode,
                'buyer_id' => $buyer->id,
                'supplier_id' => $supplierId,
                'product_id' => $product->id,
                'group_buying_id' => null,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total_price' => $totalPrice,
                'type' => 'single',
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'notes' => $data['notes'] ?? null,
            ]);
        });
    }

    /**
     * Automatically create orders for all members when a group buying reaches its target.
     *
     * @return array<Order>
     */
    public function createGroupBuyingOrders(GroupBuying $groupBuying): array
    {
        $product = $groupBuying->product;
        $unitPrice = $product->price;
        $supplierId = $product->supplier_id;

        return DB::transaction(function () use ($groupBuying, $product, $unitPrice, $supplierId) {
            $orders = [];
            $members = $groupBuying->members;

            foreach ($members as $member) {
                // Check if order already exists for this member in this group campaign
                $exists = Order::where('group_buying_id', $groupBuying->id)
                    ->where('buyer_id', $member->user_id)
                    ->exists();

                if ($exists) {
                    continue;
                }

                $quantity = $member->quantity;
                $totalPrice = $quantity * $unitPrice;
                $orderCode = $this->generateOrderCode();

                $orders[] = Order::create([
                    'order_code' => $orderCode,
                    'buyer_id' => $member->user_id,
                    'supplier_id' => $supplierId,
                    'product_id' => $product->id,
                    'group_buying_id' => $groupBuying->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'total_price' => $totalPrice,
                    'type' => 'group',
                    'status' => 'pending',
                    'payment_status' => 'unpaid',
                    'notes' => 'Pesanan otomatis dari program Group Buying #' . $groupBuying->id,
                ]);
            }

            return $orders;
        });
    }

    /**
     * Update the status of the order. Only supplier can update.
     */
    public function updateStatus(User $user, Order $order, string $newStatus): Order
    {
        // Business Rule: Only the order's supplier can update status
        $supplierProfile = $order->supplier;
        if (!$supplierProfile || $supplierProfile->user_id !== $user->id) {
            throw new AuthorizationException('Hanya supplier penerima pesanan yang dapat memperbarui status pesanan ini.');
        }

        $currentStatus = $order->status;

        // Validation of Order status flow: pending -> paid -> processing -> shipped -> completed
        // Cancelled can occur before shipped.
        if ($newStatus === 'cancelled') {
            if (in_array($currentStatus, ['shipped', 'completed', 'cancelled'])) {
                throw ValidationException::withMessages([
                    'status' => ['Pesanan tidak dapat dibatalkan setelah dikirim atau diselesaikan.'],
                ]);
            }
        } else {
            $validTransitions = [
                'pending' => ['paid'],
                'paid' => ['processing'],
                'processing' => ['shipped'],
                'shipped' => ['completed'],
                'completed' => [],
                'cancelled' => [],
            ];

            if (!isset($validTransitions[$currentStatus]) || !in_array($newStatus, $validTransitions[$currentStatus])) {
                throw ValidationException::withMessages([
                    'status' => ["Transisi status tidak valid dari '{$currentStatus}' ke '{$newStatus}'."],
                ]);
            }
        }

        $order->status = $newStatus;
        $order->save();

        return $order;
    }

    /**
     * Update order payment status.
     */
    public function updatePaymentStatus(Order $order, string $paymentStatus): Order
    {
        if (!in_array($paymentStatus, ['unpaid', 'paid'])) {
            throw ValidationException::withMessages([
                'payment_status' => ['Status pembayaran tidak valid.'],
            ]);
        }

        $order->payment_status = $paymentStatus;

        // If payment status becomes paid and current order status is pending, automatically transition order status to paid
        if ($paymentStatus === 'paid' && $order->status === 'pending') {
            $order->status = 'paid';
        }

        $order->save();

        return $order;
    }

    /**
     * Generate sequential order code with locks to prevent concurrency race conditions.
     */
    public function generateOrderCode(): string
    {
        $year = Carbon::now()->year;

        return DB::transaction(function () use ($year) {
            $lastOrder = Order::where('order_code', 'like', "ORD-{$year}-%")
                ->orderBy('id', 'desc')
                ->lockForUpdate()
                ->first();

            if (!$lastOrder) {
                $nextNumber = 1;
            } else {
                $parts = explode('-', $lastOrder->order_code);
                $lastNumber = isset($parts[2]) ? (int) $parts[2] : 0;
                $nextNumber = $lastNumber + 1;
            }

            return 'ORD-' . $year . '-' . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);
        });
    }
}

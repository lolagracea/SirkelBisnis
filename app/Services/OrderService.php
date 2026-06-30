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

            $order = Order::create([
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

            // Create Invoice with 30 days tempo for B2B
            $order->invoice()->create([
                'amount' => $totalPrice,
                'payment_term_days' => 30,
                'due_date' => now()->addDays(30),
                'status' => 'unpaid'
            ]);

            // Notify Supplier
            $supplierProfile = \App\Models\SupplierProfile::find($supplierId);
            if ($supplierProfile && $supplierProfile->user_id) {
                \App\Models\Notification::create([
                    'user_id' => $supplierProfile->user_id,
                    'title' => 'Pesanan Masuk Baru',
                    'message' => "Anda menerima pesanan baru untuk {$product->name} sebanyak {$quantity} {$product->unit}.",
                    'type' => 'order',
                ]);
            }

            return $order;
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

                $order = Order::create([
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

                // Create Invoice with 30 days tempo for B2B
                $order->invoice()->create([
                    'amount' => $totalPrice,
                    'payment_term_days' => 30,
                    'due_date' => now()->addDays(30),
                    'status' => 'unpaid'
                ]);

                $orders[] = $order;

                // Notify Supplier
                $supplierProfile = \App\Models\SupplierProfile::find($supplierId);
                if ($supplierProfile && $supplierProfile->user_id) {
                    \App\Models\Notification::create([
                        'user_id' => $supplierProfile->user_id,
                        'title' => 'Pesanan Masuk Baru (Patungan)',
                        'message' => "Anda menerima pesanan patungan baru untuk {$product->name} sebanyak {$quantity} {$product->unit}.",
                        'type' => 'order',
                    ]);
                }

                // Notify UMKM Buyer
                \App\Models\Notification::create([
                    'user_id' => $member->user_id,
                    'title' => 'Pesanan Patungan Dibuat',
                    'message' => "Pesanan {$orderCode} untuk {$product->name} berhasil dibuat secara otomatis dari program patungan.",
                    'type' => 'order',
                ]);
            }

            return $orders;
        });
    }

    /**
     * Update the status of the order. Only supplier can update.
     */
    public function updateStatus(User $user, Order $order, string $newStatus, array $extraData = []): Order
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
                'pending' => ['paid', 'processing'],
                'paid' => ['processing'],
                'processing' => ['shipped', 'completed'],
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
        
        // Handle Logistics info
        if ($newStatus === 'shipped') {
            if (isset($extraData['shipping_courier'])) {
                $order->shipping_courier = $extraData['shipping_courier'];
            }
            if (isset($extraData['tracking_number'])) {
                $order->tracking_number = $extraData['tracking_number'];
            }
        }
        
        $order->save();

        // Handle Stock & Wallet Business Logic
        if ($newStatus === 'processing') {
            // Deduct stock when processing starts
            $product = $order->product;
            if ($product) {
                $product->stock = max(0, $product->stock - $order->quantity);
                $product->save();

                \App\Models\StockLedger::create([
                    'product_id' => $product->id,
                    'change_amount' => -$order->quantity,
                    'reason' => "Pesanan diproses: {$order->order_code}",
                ]);
            }
        } elseif ($newStatus === 'completed') {
            // Add funds to supplier wallet when order is completed
            $supplierProfile = $order->supplier;
            if ($supplierProfile) {
                $supplierProfile->balance += $order->total_price;
                $supplierProfile->save();

                \App\Models\WalletTransaction::create([
                    'supplier_id' => $supplierProfile->id,
                    'amount' => $order->total_price,
                    'type' => 'income',
                    'status' => 'completed',
                    'description' => "Pendapatan dari pesanan {$order->order_code}",
                ]);
            }
        }

        // Notify UMKM Buyer with customized, friendly messages
        $title = 'Status Pesanan Diperbarui';
        $message = "Status pesanan {$order->order_code} (" . ($order->product->name ?? 'Produk') . ") diperbarui menjadi: " . ucfirst($newStatus) . ".";

        if ($newStatus === 'processing') {
            $message = "Pesanan Anda {$order->order_code} (" . ($order->product->name ?? 'Produk') . ") sudah siap diproses oleh supplier dan akan segera dikirimkan.";
        } elseif ($newStatus === 'shipped') {
            $message = "Kabar baik! Pesanan Anda {$order->order_code} (" . ($order->product->name ?? 'Produk') . ") sedang dalam perjalanan menuju lokasi Anda.";
        } elseif ($newStatus === 'completed') {
            $message = "Pesanan Anda {$order->order_code} (" . ($order->product->name ?? 'Produk') . ") telah selesai diproses dan berhasil diterima.";
        } elseif ($newStatus === 'cancelled') {
            $message = "Pesanan Anda {$order->order_code} (" . ($order->product->name ?? 'Produk') . ") telah dibatalkan.";
        } elseif ($newStatus === 'paid') {
            $message = "Pembayaran untuk pesanan {$order->order_code} (" . ($order->product->name ?? 'Produk') . ") telah diverifikasi. Menunggu supplier memproses pesanan Anda.";
        }

        \App\Models\Notification::create([
            'user_id' => $order->buyer_id,
            'title' => $title,
            'message' => $message,
            'type' => 'order',
        ]);

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

        // Notify UMKM Buyer
        $buyerTitle = 'Status Pembayaran Diperbarui';
        $buyerMessage = "Status pembayaran pesanan {$order->order_code} (" . ($order->product->name ?? 'Produk') . ") telah diubah menjadi: " . strtoupper($paymentStatus) . ".";
        
        if ($paymentStatus === 'paid') {
            $buyerMessage = "Pembayaran untuk pesanan {$order->order_code} (" . ($order->product->name ?? 'Produk') . ") berhasil diterima. Menunggu supplier memproses pesanan Anda.";
        }

        \App\Models\Notification::create([
            'user_id' => $order->buyer_id,
            'title' => $buyerTitle,
            'message' => $buyerMessage,
            'type' => 'order',
        ]);

        // Notify Supplier
        $supplierProfile = \App\Models\SupplierProfile::find($order->supplier_id);
        if ($supplierProfile && $supplierProfile->user_id) {
            $supplierTitle = 'Status Pembayaran Diperbarui';
            $supplierMessage = "Status pembayaran pesanan {$order->order_code} (" . ($order->product->name ?? 'Produk') . ") telah diubah menjadi: " . strtoupper($paymentStatus) . ".";
            
            if ($paymentStatus === 'paid') {
                $supplierMessage = "Pembayaran untuk pesanan {$order->order_code} (" . ($order->product->name ?? 'Produk') . ") telah lunas. Silakan segera proses pesanan tersebut.";
            }

            \App\Models\Notification::create([
                'user_id' => $supplierProfile->user_id,
                'title' => $supplierTitle,
                'message' => $supplierMessage,
                'type' => 'order',
            ]);
        }

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

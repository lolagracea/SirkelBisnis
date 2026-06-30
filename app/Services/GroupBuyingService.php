<?php

namespace App\Services;

use App\Models\GroupBuying;
use App\Models\GroupBuyingMember;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class GroupBuyingService
{
    protected OrderService $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    /**
     * Create a new group buying group.
     */
    public function createGroupBuying(User $creator, array $data): GroupBuying
    {
        // Business Rule: Only UMKM users can create group buying
        if ($creator->role !== 'umkm') {
            throw ValidationException::withMessages([
                'creator' => ['Hanya pengguna dengan peran UMKM yang dapat membuat group buying (patungan).'],
            ]);
        }

        $groupBuying = GroupBuying::create([
            'product_id' => $data['product_id'],
            'creator_id' => $creator->id,
            'target_quantity' => $data['target_quantity'],
            'current_quantity' => 0,
            'min_participants' => $data['min_participants'],
            'deadline' => $data['deadline'],
            'status' => 'open',
        ]);

        \App\Models\Notification::create([
            'user_id' => $creator->id,
            'title' => 'Program Patungan Dibuat',
            'message' => "Program patungan Anda untuk produk " . ($groupBuying->product->name ?? 'Bahan Baku') . " berhasil dibuat dengan target volume {$groupBuying->target_quantity} unit.",
            'type' => 'patungan',
        ]);

        return $groupBuying;
    }

    /**
     * Join an existing group buying group.
     */
    public function joinGroupBuying(User $user, GroupBuying $groupBuying, int $quantity): GroupBuyingMember
    {
        // Business Rule: Only UMKM users can join group buying
        if ($user->role !== 'umkm') {
            throw ValidationException::withMessages([
                'user' => ['Hanya pengguna dengan peran UMKM yang dapat bergabung dalam group buying.'],
            ]);
        }


        // Business Rule: Cannot join if status is not open
        if ($groupBuying->status !== 'open') {
            throw ValidationException::withMessages([
                'status' => ["Tidak dapat bergabung karena status group buying ini adalah {$groupBuying->status}."],
            ]);
        }

        // Business Rule: Cannot join after deadline
        if (Carbon::today()->gt($groupBuying->deadline)) {
            throw ValidationException::withMessages([
                'deadline' => ['Tidak dapat bergabung karena batas waktu (deadline) telah terlewati.'],
            ]);
        }

        return DB::transaction(function () use ($user, $groupBuying, $quantity) {
            // Re-fetch dengan row-level lock di dalam transaksi.
            // Semua request concurrent akan ANTRI di sini dan baca nilai terbaru.
            $lockedGroupBuying = GroupBuying::lockForUpdate()->findOrFail($groupBuying->id);

            // Re-validasi status SETELAH dapat lock (status bisa berubah saat menunggu)
            if ($lockedGroupBuying->status !== 'open') {
                throw ValidationException::withMessages([
                    'status' => ["Tidak dapat bergabung karena status group buying ini telah berubah menjadi {$lockedGroupBuying->status}."],
                ]);
            }

            // Cek duplikat member di dalam lock agar atomik
            $alreadyJoined = GroupBuyingMember::where('group_buying_id', $lockedGroupBuying->id)
                ->where('user_id', $user->id)
                ->exists();

            if ($alreadyJoined) {
                throw ValidationException::withMessages([
                    'user' => ['Anda sudah bergabung dalam group buying (patungan) ini sebelumnya.'],
                ]);
            }

            $product = $lockedGroupBuying->product;
            $amount  = $quantity * $product->price;

            $member = GroupBuyingMember::create([
                'group_buying_id' => $lockedGroupBuying->id,
                'user_id'         => $user->id,
                'quantity'        => $quantity,
                'amount'          => $amount,
                'status'          => 'joined',
            ]);

            // Atomic increment — SQL: UPDATE group_buyings SET current_quantity = current_quantity + ?
            $lockedGroupBuying->increment('current_quantity', $quantity);

            // Refresh untuk ambil nilai terbaru sebelum cek status
            $lockedGroupBuying->refresh();

            $this->updateStatus($lockedGroupBuying);

            \App\Models\Notification::create([
                'user_id' => $lockedGroupBuying->creator_id,
                'title'   => 'Anggota Baru Patungan',
                'message' => "{$user->name} baru saja bergabung ke program patungan Anda untuk " . ($product->name ?? 'Bahan Baku') . " dengan kuantitas {$quantity} unit.",
                'type'    => 'patungan',
            ]);

            \App\Models\Notification::create([
                'user_id' => $user->id,
                'title'   => 'Berhasil Ikut Patungan',
                'message' => "Anda telah berhasil bergabung ke program patungan " . ($product->name ?? 'Bahan Baku') . " dengan kuantitas {$quantity} unit.",
                'type'    => 'patungan',
            ]);

            return $member;
        });
    }


    /**
     * Cancel an existing group buying group.
     */
    public function cancelGroupBuying(User $user, GroupBuying $groupBuying): GroupBuying
    {
        // Business Rule: Only creator can cancel
        if ($user->id !== $groupBuying->creator_id) {
            throw new AuthorizationException('Hanya pembuat (creator) patungan yang dapat membatalkannya.');
        }

        // Check if group buying is already closed or cancelled
        if ($groupBuying->status !== 'open') {
            throw ValidationException::withMessages([
                'status' => ["Hanya group buying dengan status open yang dapat dibatalkan."],
            ]);
        }

        $groupBuying->status = 'cancelled';
        $groupBuying->save();

        // Notify members about cancellation
        $members = $groupBuying->members;
        $productName = $groupBuying->product->name ?? 'Bahan Baku';
        foreach ($members as $member) {
            if ($member->user_id !== $user->id) {
                \App\Models\Notification::create([
                    'user_id' => $member->user_id,
                    'title' => 'Patungan Dibatalkan',
                    'message' => "Program patungan {$productName} yang Anda ikuti telah dibatalkan oleh inisiator.",
                    'type' => 'patungan',
                ]);
            }
        }

        return $groupBuying;
    }

    /**
     * Calculate current progress percentage.
     */
    public function calculateProgress(GroupBuying $groupBuying): float
    {
        if ($groupBuying->target_quantity <= 0) {
            return 0;
        }

        return round(($groupBuying->current_quantity / $groupBuying->target_quantity) * 100, 2);
    }

    /**
     * Update the status of the group buying.
     */
    public function updateStatus(GroupBuying $groupBuying): void
    {
        // If current_quantity >= target_quantity status automatically becomes completed
        if ($groupBuying->current_quantity >= $groupBuying->target_quantity) {
            $groupBuying->status = 'completed';
            $groupBuying->save();

            // Notify Creator
            \App\Models\Notification::create([
                'user_id' => $groupBuying->creator_id,
                'title' => 'Patungan Berhasil',
                'message' => "Program patungan Anda untuk produk " . ($groupBuying->product->name ?? 'Bahan Baku') . " berhasil mencapai target volume!",
                'type' => 'patungan',
            ]);

            // Automate Group Buying Order Creation
            $this->orderService->createGroupBuyingOrders($groupBuying);
            return;
        } elseif (Carbon::today()->gt($groupBuying->deadline) && $groupBuying->status === 'open') {
            // If deadline has passed and it is still open, it becomes expired
            $groupBuying->status = 'expired';
        }

        $groupBuying->save();
    }
}

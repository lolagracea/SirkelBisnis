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

        return GroupBuying::create([
            'product_id' => $data['product_id'],
            'creator_id' => $creator->id,
            'target_quantity' => $data['target_quantity'],
            'current_quantity' => 0,
            'min_participants' => $data['min_participants'],
            'deadline' => $data['deadline'],
            'status' => 'open',
        ]);
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

        // Business Rule: A user cannot join the same group buying twice
        $exists = GroupBuyingMember::where('group_buying_id', $groupBuying->id)
            ->where('user_id', $user->id)
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'user' => ['Anda sudah bergabung dalam group buying (patungan) ini sebelumnya.'],
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
            // Calculate amount = quantity * product_price
            $product = $groupBuying->product;
            $amount = $quantity * $product->price;

            // Create GroupBuyingMember record
            $member = GroupBuyingMember::create([
                'group_buying_id' => $groupBuying->id,
                'user_id' => $user->id,
                'quantity' => $quantity,
                'amount' => $amount,
                'status' => 'joined',
            ]);

            // Automatically increase current_quantity
            $groupBuying->current_quantity += $quantity;

            // Trigger status check/update
            $this->updateStatus($groupBuying);

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

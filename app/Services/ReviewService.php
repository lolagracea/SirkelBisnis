<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Review;
use App\Models\SupplierProfile;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReviewService
{
    /**
     * Submit a new review for a completed order.
     */
    public function createReview(User $user, array $data): Review
    {
        // Business Rule: Only UMKM users can submit reviews
        if ($user->role !== 'umkm') {
            throw ValidationException::withMessages([
                'user' => ['Hanya pengguna dengan peran UMKM yang dapat memberikan ulasan.'],
            ]);
        }

        $order = Order::findOrFail($data['order_id']);

        // Authorization: Only the buyer of this order can review it
        if ($order->buyer_id !== $user->id) {
            throw new AuthorizationException('Anda tidak memiliki wewenang untuk mengulas pesanan ini.');
        }

        // Business Rule: Only completed orders can be reviewed
        if ($order->status !== 'completed') {
            throw ValidationException::withMessages([
                'order' => ['Hanya pesanan yang sudah selesai (completed) yang dapat diulas.'],
            ]);
        }

        // Business Rule: One order can only have one review
        $exists = Review::where('order_id', $order->id)->exists();
        if ($exists) {
            throw ValidationException::withMessages([
                'order_id' => ['Pesanan ini sudah pernah diulas sebelumnya.'],
            ]);
        }

        return DB::transaction(function () use ($user, $order, $data) {
            $review = Review::create([
                'order_id' => $order->id,
                'supplier_id' => $order->supplier_id,
                'user_id' => $user->id,
                'rating' => $data['rating'],
                'comment' => $data['comment'],
            ]);

            // Recalculate supplier rating
            $this->calculateSupplierRating($order->supplier_id);

            return $review;
        });
    }

    /**
     * Update an existing review. Only the owner can update.
     */
    public function updateReview(User $user, Review $review, array $data): Review
    {
        // Business Rule: Only review owner can update
        if ($review->user_id !== $user->id) {
            throw new AuthorizationException('Hanya penulis ulasan yang dapat memperbarui ulasan ini.');
        }

        return DB::transaction(function () use ($review, $data) {
            $review->update([
                'rating' => $data['rating'],
                'comment' => $data['comment'],
            ]);

            // Recalculate supplier rating
            $this->calculateSupplierRating($review->supplier_id);

            return $review;
        });
    }

    /**
     * Delete an existing review. Only owner or admin.
     */
    public function deleteReview(User $user, Review $review): void
    {
        // Business Rule: Only owner or admin can delete
        $isOwner = $review->user_id === $user->id;
        $isAdmin = $user->role === 'admin';

        if (!$isOwner && !$isAdmin) {
            throw new AuthorizationException('Anda tidak memiliki wewenang untuk menghapus ulasan ini.');
        }

        DB::transaction(function () use ($review) {
            $supplierId = $review->supplier_id;
            $review->delete();

            // Recalculate supplier rating
            $this->calculateSupplierRating($supplierId);
        });
    }

    /**
     * Recalculate average rating for a supplier and save to supplier_profiles table.
     */
    public function calculateSupplierRating(int $supplierId): float
    {
        $average = Review::where('supplier_id', $supplierId)->avg('rating') ?? 0.00;
        $averageFormatted = round($average, 2);

        SupplierProfile::where('id', $supplierId)->update([
            'rating' => $averageFormatted,
        ]);

        return (float) $averageFormatted;
    }
}

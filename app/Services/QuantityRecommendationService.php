<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;

class QuantityRecommendationService
{
    /**
     * Calculate average usage from order history or fallback configurations.
     * Logic: Query last 5 orders and get the average quantity.
     *
     * @param User $user
     * @return float
     */
    public function calculateAverageUsage(User $user): float
    {
        $orders = Order::where('buyer_id', $user->id)
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        $count = $orders->count();

        if ($count > 0) {
            return (float) $orders->avg('quantity');
        }

        // Fallback: Use profile monthly estimate divided by 6
        $profile = $user->umkmProfile;
        $monthlyEstimate = $profile ? (int) $profile->monthly_need_estimate : 300;
        if ($monthlyEstimate <= 0) {
            $monthlyEstimate = 300; // Safe default
        }

        return (float) ($monthlyEstimate / 6.0); // e.g. 300 / 6 = 50.0
    }

    /**
     * Recommend quantity based on average usage and current stock.
     *
     * @param User $user
     * @param int $currentStock
     * @return array
     */
    public function recommendQuantity(User $user, int $currentStock): array
    {
        $avgUsage = $this->calculateAverageUsage($user);

        // Standard safety multipliers
        $minSafe = (int) round($avgUsage * 0.8);
        $maxSafe = (int) round($avgUsage * 1.2);

        // Recommend restocking to the maximum safe target level
        $recommended = (int) max(0, $maxSafe - $currentStock);

        return [
            'recommended_quantity' => $recommended,
            'minimum_safe_quantity' => $minSafe,
            'maximum_safe_quantity' => $maxSafe,
        ];
    }
}

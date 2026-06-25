<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Carbon\Carbon;

class RestockPredictionService
{
    /**
     * Calculate consumption rate baselines.
     * Logic: Calculate average days between purchases, average quantity, and monthly consumption.
     *
     * @param User $user
     * @return array
     */
    public function calculateConsumptionRate(User $user): array
    {
        $orders = Order::where('buyer_id', $user->id)
            ->where('status', 'completed')
            ->orderBy('created_at', 'asc')
            ->get();

        $count = $orders->count();

        // If user has at least 2 completed orders, compute from history
        if ($count >= 2) {
            $firstOrderDate = Carbon::parse($orders->first()->created_at);
            $lastOrderDate = Carbon::parse($orders->last()->created_at);

            $totalDays = $firstOrderDate->diffInDays($lastOrderDate);

            // Avoid division by zero if all orders happened on the same day
            $averageDays = $count > 1 ? max(1.0, (float) ($totalDays / ($count - 1))) : 30.0;

            $totalQuantity = $orders->sum('quantity');
            $averageQuantity = (float) ($totalQuantity / $count);

            $dailyRate = $averageQuantity / $averageDays;
            $monthlyConsumption = $dailyRate * 30.0;

            return [
                'average_days_between_purchases' => (float) round($averageDays, 2),
                'average_quantity_purchased' => (float) round($averageQuantity, 2),
                'daily_consumption_rate' => (float) $dailyRate,
                'monthly_consumption' => (float) round($monthlyConsumption, 2),
            ];
        }

        // Fallback Logic: Uses UMKM profile details
        $profile = $user->umkmProfile;
        $monthlyEstimate = $profile ? (int) $profile->monthly_need_estimate : 150;
        if ($monthlyEstimate <= 0) {
            $monthlyEstimate = 150; // Safeguard fallback
        }

        $dailyRate = $monthlyEstimate / 30.0;

        return [
            'average_days_between_purchases' => 30.0,
            'average_quantity_purchased' => (float) $monthlyEstimate,
            'daily_consumption_rate' => $dailyRate,
            'monthly_consumption' => (float) $monthlyEstimate,
        ];
    }

    /**
     * Predict when UMKM needs to restock materials.
     * Logic: Estimate days until stock depletion and recommended restock date.
     *
     * @param User $user
     * @param int $currentStock
     * @param array $consumptionBaseline
     * @return array
     */
    public function predictRestockDate(User $user, int $currentStock, array $consumptionBaseline): array
    {
        $dailyRate = $consumptionBaseline['daily_consumption_rate'] ?? 0;

        if ($dailyRate <= 0) {
            // Default fallback if no consumption can be calculated
            return [
                'estimated_restock_date' => Carbon::now()->addDays(30)->toDateString(),
                'days_remaining' => 30,
            ];
        }

        // Days remaining is stock divided by daily rate
        $daysRemaining = (int) floor($currentStock / $dailyRate);

        // Recommended restock date
        $restockDate = Carbon::now()->addDays($daysRemaining)->toDateString();

        return [
            'estimated_restock_date' => $restockDate,
            'days_remaining' => $daysRemaining,
        ];
    }

    /**
     * Predict recommended quantity to restock.
     * Logic: Estimate recommended quantity based on consumption rate.
     *
     * @param User $user
     * @param array $consumptionBaseline
     * @return int
     */
    public function predictQuantity(User $user, array $consumptionBaseline): int
    {
        // Recommends quantity based on average quantity purchased (or fallback if empty)
        $avgQty = $consumptionBaseline['average_quantity_purchased'] ?? 50.0;

        return (int) max(10, round($avgQty));
    }
}

<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\SupplierProfile;
use Illuminate\Support\Facades\DB;

class SirkelScoreService
{
    /**
     * Calculate Review Score for a supplier.
     * Formula: average_rating / 5 * 100
     */
    public function calculateReviewScore(SupplierProfile $supplier): float
    {
        $averageRating = Review::where('supplier_id', $supplier->id)->avg('rating') ?? $supplier->rating ?? 0.00;
        $score = ($averageRating / 5.0) * 100.0;
        return (float) min(100.0, max(0.0, $score));
    }

    /**
     * Calculate Order Completion Score.
     * Formula: completed_orders / total_orders * 100
     */
    public function calculateOrderCompletionScore(SupplierProfile $supplier): float
    {
        $totalOrders = Order::where('supplier_id', $supplier->id)->count();
        if ($totalOrders === 0) {
            return 0.00;
        }

        $completedOrders = Order::where('supplier_id', $supplier->id)
            ->where('status', 'completed')
            ->count();

        $score = ($completedOrders / $totalOrders) * 100.0;
        return (float) min(100.0, max(0.0, $score));
    }

    /**
     * Calculate Delivery Performance Score.
     * Formula: shipped_and_completed_orders / total_orders * 100
     */
    public function calculateDeliveryPerformanceScore(SupplierProfile $supplier): float
    {
        $totalOrders = Order::where('supplier_id', $supplier->id)->count();
        if ($totalOrders === 0) {
            return 0.00;
        }

        $successfulDeliveries = Order::where('supplier_id', $supplier->id)
            ->whereIn('status', ['shipped', 'completed'])
            ->count();

        $score = ($successfulDeliveries / $totalOrders) * 100.0;
        return (float) min(100.0, max(0.0, $score));
    }

    /**
     * Calculate Activity Score.
     * Based on:
     * - Product counts: 10 pts per product, max 50 pts.
     * - Responded orders: 10 pts per non-pending order, max 30 pts.
     * - Active listings: 5 pts per in-stock product, max 20 pts.
     */
    public function calculateActivityScore(SupplierProfile $supplier): float
    {
        $productCount = Product::where('supplier_id', $supplier->id)->count();
        $respondedOrders = Order::where('supplier_id', $supplier->id)
            ->where('status', '!=', 'pending')
            ->count();
        $activeListings = Product::where('supplier_id', $supplier->id)
            ->where('stock', '>', 0)
            ->count();

        $productScore = min(50.0, $productCount * 10.0);
        $orderScore = min(30.0, $respondedOrders * 10.0);
        $listingScore = min(20.0, $activeListings * 5.0);

        return (float) ($productScore + $orderScore + $listingScore);
    }

    /**
     * Calculate both breakdown and final sirkel score.
     */
    public function calculateSirkelScore(SupplierProfile $supplier): array
    {
        $reviewScore = $this->calculateReviewScore($supplier);
        $completionScore = $this->calculateOrderCompletionScore($supplier);
        $deliveryScore = $this->calculateDeliveryPerformanceScore($supplier);
        $activityScore = $this->calculateActivityScore($supplier);

        // Final weighted formula
        $sirkelScore = ($reviewScore * 0.40) +
                       ($completionScore * 0.30) +
                       ($deliveryScore * 0.20) +
                       ($activityScore * 0.10);

        return [
            'sirkel_score' => (float) round($sirkelScore, 2),
            'review_score' => (float) round($reviewScore, 2),
            'completion_score' => (float) round($completionScore, 2),
            'delivery_score' => (float) round($deliveryScore, 2),
            'activity_score' => (float) round($activityScore, 2),
        ];
    }

    /**
     * Recalculate score and save it to the supplier profile in the database.
     */
    public function updateSupplierScore(SupplierProfile $supplier): SupplierProfile
    {
        $scores = $this->calculateSirkelScore($supplier);

        $supplier->update([
            'sirkel_score' => $scores['sirkel_score'],
        ]);

        return $supplier;
    }

    /**
     * Recalculate score for all suppliers. Admin helper.
     */
    public function recalculateAllSuppliers(): void
    {
        DB::transaction(function () {
            $suppliers = SupplierProfile::lockForUpdate()->get();

            foreach ($suppliers as $supplier) {
                $this->updateSupplierScore($supplier);
            }
        });
    }
}

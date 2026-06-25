<?php

namespace App\Services;

use App\Models\GroupBuying;
use App\Models\Order;
use App\Models\User;

class GroupBuyingMatchingService
{
    /**
     * Find matched active group buying opportunities for a UMKM user.
     *
     * @param User $user
     * @param float $latitude
     * @param float $longitude
     * @return array
     */
    public function findMatches(User $user, float $latitude, float $longitude): array
    {
        $profile = $user->umkmProfile;
        $category = $profile ? $profile->raw_material_category : null;

        if (!$category) {
            return [];
        }

        // Fetch all open group buyings with product and supplier profiles loaded
        $campaigns = GroupBuying::where('status', 'open')
            ->with(['product.supplier'])
            ->get();

        $matches = [];

        foreach ($campaigns as $campaign) {
            $product = $campaign->product;

            // Rule 1: Same product category
            if (!$product || strcasecmp($product->category, $category) !== 0) {
                continue;
            }

            $supplier = $product->supplier;
            if (!$supplier || $supplier->latitude === null || $supplier->longitude === null) {
                continue;
            }

            // Rule 2: Radius check (max 20 km)
            $distance = $this->calculateDistance($latitude, $longitude, (float) $supplier->latitude, (float) $supplier->longitude);

            if ($distance > 20.0) {
                continue;
            }

            // Calculate metrics
            $matchScore = $this->calculateMatchScore($user, $campaign, $distance);
            $savingPotential = $this->calculateSavingPotential($campaign);

            $matches[] = [
                'group_buying_id' => $campaign->id,
                'match_score' => $matchScore,
                'saving_percentage' => $savingPotential,
                'distance' => round($distance, 1) . ' km',
            ];
        }

        // Sort by match score descending
        usort($matches, function ($a, $b) {
            return $b['match_score'] <=> $a['match_score'];
        });

        return $matches;
    }

    /**
     * Calculate match score based on distance, progress, history, and frequency.
     *
     * @param User $user
     * @param GroupBuying $groupBuying
     * @param float $distance
     * @return int
     */
    public function calculateMatchScore(User $user, GroupBuying $groupBuying, float $distance): int
    {
        // 1. Distance score (max 40 pts)
        $distanceScore = max(0.0, 40.0 * (1.0 - ($distance / 20.0)));

        // 2. Purchase History score (max 30 pts)
        $product = $groupBuying->product;
        $supplier = $product ? $product->supplier : null;

        $hasProductHistory = false;
        $hasSupplierHistory = false;

        if ($product) {
            $hasProductHistory = Order::where('buyer_id', $user->id)
                ->where('product_id', $product->id)
                ->where('status', 'completed')
                ->exists();
        }

        if ($supplier) {
            $hasSupplierHistory = Order::where('buyer_id', $user->id)
                ->where('supplier_id', $supplier->id)
                ->where('status', 'completed')
                ->exists();
        }

        $historyScore = 0.0;
        if ($hasProductHistory) {
            $historyScore = 30.0;
        } elseif ($hasSupplierHistory) {
            $historyScore = 15.0;
        }

        // 3. Campaign Progress score (max 20 pts)
        $progress = $groupBuying->target_quantity > 0
            ? ($groupBuying->current_quantity / $groupBuying->target_quantity)
            : 0.0;
        $progressScore = min(20.0, $progress * 20.0);

        // 4. Order Frequency score (max 10 pts)
        $ordersCount = Order::where('buyer_id', $user->id)
            ->where('status', 'completed')
            ->count();
        $frequencyScore = min(10.0, $ordersCount * 2.0);

        $totalScore = $distanceScore + $historyScore + $progressScore + $frequencyScore;

        return (int) min(100, round($totalScore));
    }

    /**
     * Calculate saving potential (yields savings in range 10% - 20%).
     *
     * @param GroupBuying $groupBuying
     * @return int
     */
    public function calculateSavingPotential(GroupBuying $groupBuying): int
    {
        $target = $groupBuying->target_quantity > 0 ? $groupBuying->target_quantity : 1.0;
        $progress = $groupBuying->current_quantity / $target;

        return 10 + (int) round($progress * 10.0);
    }

    /**
     * Haversine formula to compute distance between two points in km.
     */
    private function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371.0; // in kilometers

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2.0) * sin($dLat / 2.0) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2.0) * sin($dLon / 2.0);

        $c = 2.0 * atan2(sqrt($a), sqrt(1.0 - $a));

        return $earthRadius * $c;
    }
}

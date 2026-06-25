<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;

class PriceAnalysisService
{
    /**
     * Calculate local/category average market price.
     *
     * @param Product $product
     * @return float
     */
    public function calculateMarketAverage(Product $product): float
    {
        // 1. Calculate average unit price from historical transactions (completed orders) in the same category
        $orderAvg = Order::whereHas('product', function ($q) use ($product) {
            $q->where('category', $product->category);
        })->where('status', 'completed')
          ->avg('unit_price');

        if ($orderAvg !== null) {
            return (float) $orderAvg;
        }

        // 2. Fallback: Calculate average price from products in the same category
        $productAvg = Product::where('category', $product->category)->avg('price');

        if ($productAvg !== null) {
            return (float) $productAvg;
        }

        // 3. Fallback: Use the product's own price
        return (float) $product->price;
    }

    /**
     * Detect pricing anomalies compared to average market pricing.
     * Rules:
     * - Green: within 10%
     * - Yellow: up to 30% above average
     * - Red: above 30% above average
     *
     * @param float $currentPrice
     * @param float $marketAverage
     * @return array
     */
    public function detectAnomaly(float $currentPrice, float $marketAverage): array
    {
        if ($marketAverage <= 0.0) {
            return [
                'status' => 'green',
                'difference_percentage' => 0,
            ];
        }

        // Calculate difference percentage relative to market average
        $diffPercent = (int) round((($currentPrice - $marketAverage) / $marketAverage) * 100);

        if ($diffPercent <= 10) {
            $status = 'green';
        } elseif ($diffPercent <= 30) {
            $status = 'yellow';
        } else {
            $status = 'red';
        }

        return [
            'status' => $status,
            'difference_percentage' => $diffPercent,
        ];
    }

    /**
     * Generate complete pricing insights for a specific product.
     *
     * @param Product $product
     * @return array
     */
    public function generateInsight(Product $product): array
    {
        $currentPrice = (float) $product->price;
        $marketAverage = $this->calculateMarketAverage($product);

        $anomaly = $this->detectAnomaly($currentPrice, $marketAverage);
        $diffPercent = $anomaly['difference_percentage'];
        $status = $anomaly['status'];

        // Determine human-readable summary
        if ($diffPercent < 0) {
            $summary = 'Harga lebih rendah dari rata-rata pasar.';
        } elseif ($diffPercent <= 10) {
            $summary = 'Harga bersaing dan berada dalam batas wajar rata-rata pasar.';
        } elseif ($status === 'yellow') {
            $summary = 'Harga berada di atas rata-rata pasar (dalam batas 30%).';
        } else {
            $summary = 'Harga berada jauh di atas rata-rata pasar. Evaluasi diperlukan.';
        }

        return [
            'status' => $status,
            'difference_percentage' => $diffPercent,
            'market_average' => (float) round($marketAverage, 2),
            'current_price' => $currentPrice,
            'summary' => $summary,
        ];
    }
}

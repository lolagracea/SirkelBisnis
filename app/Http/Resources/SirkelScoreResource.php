<?php

namespace App\Http\Resources;

use App\Services\SirkelScoreService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SirkelScoreResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $service = app(SirkelScoreService::class);
        $scores = $service->calculateSirkelScore($this->resource);
        
        $sirkelScore = $scores['sirkel_score'];
        $badge = $this->getBadge($sirkelScore);
        
        // Calculate rank among all suppliers
        $rank = \App\Models\SupplierProfile::where('sirkel_score', '>', $sirkelScore)->count() + 1;
        $totalSuppliers = \App\Models\SupplierProfile::count();

        return [
            'sirkel_score' => (float) $sirkelScore,
            'badge' => $badge,
            'rank' => $rank,
            'total_suppliers' => $totalSuppliers,
            'review_score' => (float) $scores['review_score'],
            'completion_score' => (float) $scores['completion_score'],
            'delivery_score' => (float) $scores['delivery_score'],
            'activity_score' => (float) $scores['activity_score'],
        ];
    }

    /**
     * Get Badge based on SirkelScore.
     */
    private function getBadge(float $score): string
    {
        if ($score >= 90.0) {
            return 'Elite Supplier';
        } elseif ($score >= 80.0) {
            return 'Trusted Supplier';
        } elseif ($score >= 70.0) {
            return 'Active Supplier';
        } else {
            return 'Developing Supplier';
        }
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupplierResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'supplier_name' => $this->supplier_name,
            'description' => $this->description,
            'address' => $this->address,
            'latitude' => $this->latitude !== null ? (float) $this->latitude : null,
            'longitude' => $this->longitude !== null ? (float) $this->longitude : null,
            'verified' => (bool) $this->verified,
            'rating' => (float) $this->rating,
            'review_count' => (int) ($this->reviews_count ?? $this->reviews()->count()),
            'average_rating' => (float) $this->rating,
            'sirkel_score' => (float) ($this->sirkel_score ?? 0.00),
            'badge' => $this->getBadge((float) ($this->sirkel_score ?? 0.00)),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                    'phone_number' => $this->user->phone_number,
                    'nik' => $this->user->nik,
                ];
            }),
            'products' => $this->whenLoaded('products', function () {
                return ProductResource::collection($this->products);
            }),
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

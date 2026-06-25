<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GroupBuyingResource extends JsonResource
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
            'product_id' => $this->product_id,
            'creator_id' => $this->creator_id,
            'target_quantity' => (int) $this->target_quantity,
            'current_quantity' => (int) $this->current_quantity,
            'min_participants' => (int) $this->min_participants,
            'deadline' => $this->deadline?->format('Y-m-d'),
            'status' => $this->status,
            'progress_percentage' => (float) $this->progress_percentage,
            'participant_count' => (int) $this->participant_count,
            'days_remaining' => (int) $this->days_remaining,
            'eligible_for_fulfillment' => (bool) $this->eligible_for_fulfillment,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Relations
            'product' => new ProductResource($this->whenLoaded('product')),
            'creator' => $this->whenLoaded('creator', function () {
                return [
                    'id' => $this->creator->id,
                    'name' => $this->creator->name,
                    'email' => $this->creator->email,
                    'phone_number' => $this->creator->phone_number,
                ];
            }),
            'members' => GroupBuyingMemberResource::collection($this->whenLoaded('members')),
        ];
    }
}

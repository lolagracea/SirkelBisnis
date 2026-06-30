<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
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
            'order_code' => $this->order_code,
            'buyer_id' => $this->buyer_id,
            'supplier_id' => $this->supplier_id,
            'product_id' => $this->product_id,
            'group_buying_id' => $this->group_buying_id,
            'quantity' => (int) $this->quantity,
            'unit_price' => (float) $this->unit_price,
            'total_price' => (float) $this->total_price,
            'type' => $this->type,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Relations
            'buyer' => $this->whenLoaded('buyer', function () {
                return [
                    'id' => $this->buyer->id,
                    'name' => $this->buyer->name,
                    'email' => $this->buyer->email,
                    'phone_number' => $this->buyer->phone_number,
                ];
            }),
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
            'product' => new ProductResource($this->whenLoaded('product')),
            'group_buying' => new GroupBuyingResource($this->whenLoaded('groupBuying')),
            'invoice' => $this->whenLoaded('invoice', function () {
                return [
                    'id' => $this->invoice->id,
                    'amount' => $this->invoice->amount,
                    'status' => $this->invoice->status,
                    'payment_method' => $this->invoice->payment_method,
                    'due_date' => $this->invoice->due_date,
                ];
            }),
        ];
    }
}

<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SupplierOfferSubmitted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $offer;

    /**
     * Create a new event instance.
     */
    public function __construct(\App\Models\SupplierOffer $offer)
    {
        $this->offer = $offer;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('group-buying.' . $this->offer->group_buying_id),
        ];
    }
    
    /**
     * Data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->offer->id,
            'supplier_name' => $this->offer->supplier->business_name ?? 'Supplier',
            'price_per_unit' => $this->offer->price_per_unit,
            'total_price' => $this->offer->total_price,
            'notes' => $this->offer->notes,
            'submitted_at' => $this->offer->created_at,
        ];
    }
}

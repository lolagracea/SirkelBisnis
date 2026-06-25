<?php

namespace App\Observers;

use App\Models\Order;
use App\Services\SirkelScoreService;

class OrderObserver
{
    /**
     * Handle the Order "created" event.
     */
    public function created(Order $order): void
    {
        $supplier = $order->supplier;
        if ($supplier) {
            app(SirkelScoreService::class)->updateSupplierScore($supplier);
        }
    }

    /**
     * Handle the Order "updated" event.
     */
    public function updated(Order $order): void
    {
        $supplier = $order->supplier;
        if ($supplier) {
            app(SirkelScoreService::class)->updateSupplierScore($supplier);
        }
    }

    /**
     * Handle the Order "deleted" event.
     */
    public function deleted(Order $order): void
    {
        $supplier = $order->supplier;
        if ($supplier) {
            app(SirkelScoreService::class)->updateSupplierScore($supplier);
        }
    }
}

<?php

namespace App\Observers;

use App\Models\Review;
use App\Services\SirkelScoreService;

class ReviewObserver
{
    /**
     * Handle the Review "created" event.
     */
    public function created(Review $review): void
    {
        $supplier = $review->supplier;
        if ($supplier) {
            app(SirkelScoreService::class)->updateSupplierScore($supplier);
        }
    }

    /**
     * Handle the Review "updated" event.
     */
    public function updated(Review $review): void
    {
        $supplier = $review->supplier;
        if ($supplier) {
            app(SirkelScoreService::class)->updateSupplierScore($supplier);
        }
    }

    /**
     * Handle the Review "deleted" event.
     */
    public function deleted(Review $review): void
    {
        $supplier = $review->supplier;
        if ($supplier) {
            app(SirkelScoreService::class)->updateSupplierScore($supplier);
        }
    }
}

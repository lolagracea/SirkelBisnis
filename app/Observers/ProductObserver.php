<?php

namespace App\Observers;

use App\Models\Product;
use App\Services\SirkelScoreService;

class ProductObserver
{
    /**
     * Handle the Product "created" event.
     */
    public function created(Product $product): void
    {
        $supplier = $product->supplier;
        if ($supplier) {
            app(SirkelScoreService::class)->updateSupplierScore($supplier);
        }
    }

    /**
     * Handle the Product "updated" event.
     */
    public function updated(Product $product): void
    {
        $supplier = $product->supplier;
        if ($supplier) {
            app(SirkelScoreService::class)->updateSupplierScore($supplier);
        }
    }

    /**
     * Handle the Product "deleted" event.
     */
    public function deleted(Product $product): void
    {
        $supplier = $product->supplier;
        if ($supplier) {
            app(SirkelScoreService::class)->updateSupplierScore($supplier);
        }
    }
}

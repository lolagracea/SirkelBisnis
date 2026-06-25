<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        \App\Models\Review::observe(\App\Observers\ReviewObserver::class);
        \App\Models\Order::observe(\App\Observers\OrderObserver::class);
        \App\Models\Product::observe(\App\Observers\ProductObserver::class);
    }
}

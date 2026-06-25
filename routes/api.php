<?php

use App\Http\Controllers\API\GroupBuyingController;
use App\Http\Controllers\API\OrderController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\ReviewController;
use App\Http\Controllers\API\SupplierController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Public routes
Route::get('/suppliers', [SupplierController::class, 'index']);
Route::get('/suppliers/{id}', [SupplierController::class, 'show']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

// Protected routes (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/suppliers', [SupplierController::class, 'store']);
    Route::put('/suppliers/{id}', [SupplierController::class, 'update']);
    Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy']);

    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    // Group Buying Routes
    Route::get('/group-buyings', [GroupBuyingController::class, 'index']);
    Route::get('/group-buyings/{id}', [GroupBuyingController::class, 'show']);
    Route::get('/my-group-buyings', [GroupBuyingController::class, 'myGroupBuyings']);
    Route::get('/joined-group-buyings', [GroupBuyingController::class, 'joinedGroupBuyings']);

    Route::middleware('role:umkm')->group(function () {
        Route::post('/group-buyings', [GroupBuyingController::class, 'store']);
        Route::post('/group-buyings/{id}/join', [GroupBuyingController::class, 'join']);
        Route::delete('/group-buyings/{id}', [GroupBuyingController::class, 'destroy']);
    });

    // Order Routes
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::patch('/orders/{id}/payment', [OrderController::class, 'updatePayment']);

    Route::middleware('role:umkm')->group(function () {
        Route::post('/orders', [OrderController::class, 'store']);
        Route::get('/my-orders', [OrderController::class, 'myOrders']);
    });

    Route::middleware('role:supplier')->group(function () {
        Route::get('/supplier-orders', [OrderController::class, 'supplierOrders']);
        Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
    });

    // Review Routes
    Route::get('/reviews', [ReviewController::class, 'index']);
    Route::get('/reviews/{id}', [ReviewController::class, 'show']);
    Route::get('/suppliers/{id}/reviews', [ReviewController::class, 'supplierReviews']);

    Route::middleware('role:umkm')->group(function () {
        Route::post('/reviews', [ReviewController::class, 'store']);
        Route::put('/reviews/{id}', [ReviewController::class, 'update']);
        Route::get('/my-reviews', [ReviewController::class, 'myReviews']);
    });

    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);
});

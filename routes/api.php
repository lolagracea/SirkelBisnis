<?php

use App\Http\Controllers\API\CheckoutController;
use App\Http\Controllers\API\GroupBuyingController;
use App\Http\Controllers\API\OrderController;
use App\Http\Controllers\API\XenditWebhookController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\ReviewController;
use App\Http\Controllers\API\SirkelScoreController;
use App\Http\Controllers\API\SupplierController;
use App\Http\Controllers\API\SupplierOfferController;
use App\Http\Controllers\API\AIReviewSummaryController;
use App\Http\Controllers\API\BusinessInsightController;
use App\Http\Controllers\API\RestockPredictionController;
use App\Http\Controllers\API\QuantityRecommendationController;
use App\Http\Controllers\API\GroupBuyingMatchingController;
use App\Http\Controllers\API\PriceAnalysisController;
use App\Http\Controllers\API\ReferenceController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\NotificationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public Auth routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register/umkm', [AuthController::class, 'registerUmkm']);
Route::post('/register/supplier', [AuthController::class, 'registerSupplier']);
// Reference routes (tambahkan di bawah yang sudah ada)
Route::get('/kota-kabupaten',           [ReferenceController::class, 'getCities']);
Route::get('/jenis-usaha',              [ReferenceController::class, 'getBusinessTypes']);
Route::get('/provinsi',                 [ReferenceController::class, 'getProvinces']);
Route::get('/kota-kabupaten/provinsi',  [ReferenceController::class, 'getCitiesByProvince']);
Route::get('/kecamatan',               [ReferenceController::class, 'getKecamatanByCity']);
Route::get('/kelurahan',               [ReferenceController::class, 'getKelurahanByKecamatan']);

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
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/suppliers', [SupplierController::class, 'store']);
    Route::put('/suppliers/{id}', [SupplierController::class, 'update']);
    Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy']);
    Route::get('/products/{productId}/warehouse-stock', [\App\Http\Controllers\API\WarehouseController::class, 'stockByProduct']);

    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    // Group Buying Routes
    Route::get('/group-buyings', [GroupBuyingController::class, 'index']);
    Route::get('/group-buyings/{id}', [GroupBuyingController::class, 'show']);
    Route::get('/my-group-buyings', [GroupBuyingController::class, 'myGroupBuyings']);
    Route::get('/joined-group-buyings', [GroupBuyingController::class, 'joinedGroupBuyings']);

    Route::middleware('role:umkm,sanctum')->group(function () {
        Route::post('/group-buyings', [GroupBuyingController::class, 'store']);
        Route::post('/group-buyings/{id}/join', [GroupBuyingController::class, 'join']);
        Route::delete('/group-buyings/{id}', [GroupBuyingController::class, 'destroy']);Route::get('/rfqs/umkm', [\App\Http\Controllers\API\RfqController::class, 'umkmIndex']); // sudah ada
        Route::post('/rfqs', [\App\Http\Controllers\API\RfqController::class, 'store']);
        Route::post('/rfqs/offers/{offerId}/accept', [\App\Http\Controllers\API\RfqController::class, 'acceptOffer']);
        Route::delete('/rfqs/{id}', [\App\Http\Controllers\API\RfqController::class, 'cancel']);
        Route::get('/my-subscriptions', [\App\Http\Controllers\API\SubscriptionController::class, 'umkmIndex']);
        Route::put('/my-subscriptions/{id}', [\App\Http\Controllers\API\SubscriptionController::class, 'update']);
        Route::patch('/my-subscriptions/{id}/status', [\App\Http\Controllers\API\SubscriptionController::class, 'updateStatus']);
        Route::get('/my-credit-limits', [\App\Http\Controllers\API\CreditLimitController::class, 'umkmIndex']);
    Route::get('/suppliers/{supplierId}/my-credit-limit', [\App\Http\Controllers\API\CreditLimitController::class, 'umkmShowForSupplier']);

    });

    // Order Routes
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::patch('/orders/{id}/payment', [OrderController::class, 'updatePayment']);
    Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);

    Route::middleware('role:umkm,sanctum')->group(function () {
        Route::post('/orders', [OrderController::class, 'store']);
        Route::get('/my-orders', [OrderController::class, 'myOrders']);
    });

    Route::middleware('role:supplier,sanctum')->group(function () {
        Route::get('/supplier-orders', [OrderController::class, 'supplierOrders']);
        // Supplier Offer (Tawarkan Harga pada Group Buying)
        Route::post('/group-buyings/{id}/offer', [SupplierOfferController::class, 'store']);
        Route::get('/my-offers', [SupplierOfferController::class, 'myOffers']);

        // Supplier Wallet & Analytics
        Route::get('/wallet', [\App\Http\Controllers\API\SupplierWalletController::class, 'summary']);
        Route::post('/wallet/withdraw', [\App\Http\Controllers\API\SupplierWalletController::class, 'withdraw']);
        Route::get('/analytics/supplier', [\App\Http\Controllers\API\SupplierAnalyticsController::class, 'index']);
        Route::get('/products/{productId}/stock-ledger', [\App\Http\Controllers\API\StockLedgerController::class, 'getByProduct']);

        // Bulk Upload Products
        Route::post('/products/import', [\App\Http\Controllers\API\ProductImportController::class, 'import']);

        // Vouchers
        Route::get('/vouchers', [\App\Http\Controllers\API\VoucherController::class, 'index']);
        Route::post('/vouchers', [\App\Http\Controllers\API\VoucherController::class, 'store']);
        Route::put('/vouchers/{id}', [\App\Http\Controllers\API\VoucherController::class, 'update']);
        Route::delete('/vouchers/{id}', [\App\Http\Controllers\API\VoucherController::class, 'destroy']);

        // Stock Adjustment
        Route::post('/products/{productId}/stock-adjustment', [\App\Http\Controllers\API\StockAdjustmentController::class, 'store']);

        // Supplier Bank Accounts
        Route::get('/supplier-bank-accounts', [\App\Http\Controllers\API\SupplierBankAccountController::class, 'index']);
        Route::post('/supplier-bank-accounts', [\App\Http\Controllers\API\SupplierBankAccountController::class, 'store']);
        Route::put('/supplier-bank-accounts/{id}', [\App\Http\Controllers\API\SupplierBankAccountController::class, 'update']);
        Route::delete('/supplier-bank-accounts/{id}', [\App\Http\Controllers\API\SupplierBankAccountController::class, 'destroy']);

        // Supplier CRM
        Route::get('/supplier-crm/customers', [\App\Http\Controllers\API\SupplierCRMController::class, 'getCustomers']);
        Route::post('/supplier-crm/broadcast', [\App\Http\Controllers\API\SupplierCRMController::class, 'broadcast']);

        // Bulk Actions
        Route::post('/supplier-orders/bulk-status', [\App\Http\Controllers\API\OrderController::class, 'bulkUpdateStatus']);

        // Tax Report
        Route::get('/analytics/tax-report', [\App\Http\Controllers\API\SupplierAnalyticsController::class, 'taxReport']);

        // Supplier Staff
        Route::get('/supplier-staff', [\App\Http\Controllers\Api\Supplier\SupplierStaffController::class, 'index']);
        Route::post('/supplier-staff', [\App\Http\Controllers\Api\Supplier\SupplierStaffController::class, 'store']);
        Route::delete('/supplier-staff/{id}', [\App\Http\Controllers\Api\Supplier\SupplierStaffController::class, 'destroy']);

        // Returns / RMA (Supplier side)
        Route::get('/supplier-returns', [\App\Http\Controllers\Api\Supplier\ReturnRequestController::class, 'index']);
        Route::patch('/supplier-returns/{id}/status', [\App\Http\Controllers\Api\Supplier\ReturnRequestController::class, 'updateStatus']);

        // Procurement
        Route::get('/procurement/manufacturers', [\App\Http\Controllers\Api\Supplier\ProcurementController::class, 'indexManufacturers']);
        Route::post('/procurement/manufacturers', [\App\Http\Controllers\Api\Supplier\ProcurementController::class, 'storeManufacturer']);
        Route::get('/procurement/purchase-orders', [\App\Http\Controllers\Api\Supplier\ProcurementController::class, 'indexPurchaseOrders']);
        Route::post('/procurement/purchase-orders', [\App\Http\Controllers\Api\Supplier\ProcurementController::class, 'storePurchaseOrder']);
        Route::post('/procurement/purchase-orders/{id}/receive', [\App\Http\Controllers\Api\Supplier\ProcurementController::class, 'receivePurchaseOrder']);

        // Advanced B2B Features
        Route::get('/warehouses', [\App\Http\Controllers\API\WarehouseController::class, 'index']);
        Route::post('/warehouses', [\App\Http\Controllers\API\WarehouseController::class, 'store']);
        Route::delete('/warehouses/{id}', [\App\Http\Controllers\API\WarehouseController::class, 'destroy']);

        Route::get('/credit-limits', [\App\Http\Controllers\API\CreditLimitController::class, 'index']);
        Route::post('/credit-limits', [\App\Http\Controllers\API\CreditLimitController::class, 'store']);

        Route::get('/rfqs/supplier', [\App\Http\Controllers\API\RfqController::class, 'supplierIndex']);
        Route::post('/rfqs/{id}/offer', [\App\Http\Controllers\API\RfqController::class, 'storeOffer']);

        Route::get('/subscriptions/supplier', [\App\Http\Controllers\API\SubscriptionController::class, 'index']);

        Route::get('/webhook-endpoints', [\App\Http\Controllers\API\WebhookController::class, 'index']);
        Route::post('/webhook-endpoints', [\App\Http\Controllers\API\WebhookController::class, 'store']);

        Route::get('/sponsored-products', [\App\Http\Controllers\API\SponsoredProductController::class, 'index']);
        Route::post('/sponsored-products', [\App\Http\Controllers\API\SponsoredProductController::class, 'store']);
    });

    // Chat Routes (both UMKM and Supplier)
    Route::get('/chats', [\App\Http\Controllers\API\ChatController::class, 'index']);
    Route::get('/chats/{id}', [\App\Http\Controllers\API\ChatController::class, 'show']);
    Route::post('/chats/{id}/message', [\App\Http\Controllers\API\ChatController::class, 'sendMessage']);
    Route::post('/chats/start', [\App\Http\Controllers\API\ChatController::class, 'startChat']);

    // Invoice Routes
    Route::get('/invoices', [\App\Http\Controllers\API\InvoiceController::class, 'index']);
    Route::get('/invoices/{id}', [\App\Http\Controllers\API\InvoiceController::class, 'show']);
    Route::post('/invoices/{id}/pay', [\App\Http\Controllers\API\InvoiceController::class, 'pay']); // for UMKM (legacy)
    Route::patch('/invoices/{id}/status', [\App\Http\Controllers\API\InvoiceController::class, 'updateStatus']); // for Supplier

    // ── Xendit Payment Checkout (UMKM) ─────────────────────────────────────
    Route::middleware('role:umkm')->group(function () {
        Route::post('/invoices/{invoiceId}/checkout', [CheckoutController::class, 'checkout'])
            ->name('payment.checkout');
        Route::get('/invoices/{invoiceId}/payment-status', [CheckoutController::class, 'status'])
            ->name('payment.status');
        Route::post('/invoices/{invoiceId}/simulate-payment', [CheckoutController::class, 'simulatePayment'])
            ->name('payment.simulate');
    });

    // Dispute (RMA) Routes
    Route::get('/disputes', [\App\Http\Controllers\API\DisputeController::class, 'index']);
    Route::post('/orders/{orderId}/disputes', [\App\Http\Controllers\API\DisputeController::class, 'store']); // UMKM create
    Route::patch('/disputes/{id}/status', [\App\Http\Controllers\API\DisputeController::class, 'updateStatus']); // Supplier update

    // Review Routes
    Route::get('/reviews', [ReviewController::class, 'index']);
    Route::get('/reviews/{id}', [ReviewController::class, 'show']);
    Route::get('/suppliers/{id}/reviews', [ReviewController::class, 'supplierReviews']);

    Route::middleware('role:umkm,sanctum')->group(function () {
        Route::post('/reviews', [ReviewController::class, 'store']);
        Route::put('/reviews/{id}', [ReviewController::class, 'update']);
        Route::get('/my-reviews', [ReviewController::class, 'myReviews']);

        // Apply Voucher
        Route::post('/vouchers/apply', [\App\Http\Controllers\API\VoucherController::class, 'apply']);

        // Returns / RMA (UMKM side)
        Route::post('/my-returns', [\App\Http\Controllers\Api\Supplier\ReturnRequestController::class, 'store']);

        // Advanced B2B Features
        Route::get('/rfqs/umkm', [\App\Http\Controllers\API\RfqController::class, 'umkmIndex']);
        Route::post('/subscriptions', [\App\Http\Controllers\API\SubscriptionController::class, 'store']);
    });

    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);

    // SirkelScore Routes
    Route::get('/suppliers/{id}/sirkel-score', [SirkelScoreController::class, 'show']);
    Route::post('/admin/recalculate-sirkel-score', [SirkelScoreController::class, 'recalculate']);

    // AI Review Summarizer Routes
    Route::get('/ai/review-summary/{supplierId}', [AIReviewSummaryController::class, 'show']);

    // Business Insight AI Routes
    Route::get('/ai/business-insight', [BusinessInsightController::class, 'index']);

    // Restock Prediction Routes
    Route::get('/ai/restock', [RestockPredictionController::class, 'index']);

    // Quantity Recommendation Routes
    Route::get('/ai/recommend-quantity', [QuantityRecommendationController::class, 'index']);

    // Group Buying Matching Routes
    Route::get('/ai/group-buying-match', [GroupBuyingMatchingController::class, 'index']);

    // Price Analysis Routes
    Route::get('/ai/price-analysis/{productId}', [PriceAnalysisController::class, 'show']);

    // Notification Routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
}); // End of auth:sanctum middleware group

// ──────────────────────────────────────────────────────────────────────────────
// Xendit Webhook (TANPA auth — divalidasi via x-callback-token header)
// Harus di-exclude dari CSRF dan auth middleware
// ──────────────────────────────────────────────────────────────────────────────
Route::prefix('webhook/xendit')->group(function () {
    Route::post('/qris', [XenditWebhookController::class, 'handleQris'])
        ->name('webhook.xendit.qris');
    Route::post('/va', [XenditWebhookController::class, 'handleVa'])
        ->name('webhook.xendit.va');
});

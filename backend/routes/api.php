<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\DeliveryController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\Admin\InventoryController as AdminInventoryController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Authentication
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/admin/login', [AuthController::class, 'adminLogin']);

// Products Catalog
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

// Cart & Checkout
Route::post('/cart/validate', [CartController::class, 'validateCart']);
Route::post('/checkout', [CheckoutController::class, 'checkout']);

// Public Order & Tracking Details
Route::get('/orders/{id}', [OrderController::class, 'show']);
Route::get('/orders/track/{orderNumber}', [OrderController::class, 'trackOrder']);
Route::get('/deliveries/track/{trackingNumber}', [DeliveryController::class, 'track']);
Route::get('/settings/public', [SettingController::class, 'publicSettings']);

// Payment Gateway Callbacks & Next.js Integration
Route::match(['get', 'post'], '/payment/bkash/callback', [PaymentController::class, 'bkashCallback']);
Route::post('/payment/bkash/initiate', [PaymentController::class, 'bkashInitiate']);
Route::post('/payment/bkash/verify', [PaymentController::class, 'bkashVerify']);
Route::post('/payment/bkash/failed', [PaymentController::class, 'bkashFailed']);
Route::post('/payment/sslcommerz/success', [PaymentController::class, 'sslcommerzSuccess']);
Route::post('/payment/sslcommerz/fail', [PaymentController::class, 'sslcommerzFail']);
Route::post('/payment/sslcommerz/cancel', [PaymentController::class, 'sslcommerzCancel']);

// Webhook Notifications (CarryBee, bKash, SSLCommerz IPN)
Route::post('/deliveries/webhook/carrybee', [WebhookController::class, 'carrybee']);
Route::post('/payment/bkash/webhook', [WebhookController::class, 'bkash']);
Route::post('/payment/sslcommerz/ipn', [WebhookController::class, 'sslcommerzIpn']);

/*
|--------------------------------------------------------------------------
| Authenticated Customer Routes (Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/customer/orders', [OrderController::class, 'customerOrders']);
});

/*
|--------------------------------------------------------------------------
| Protected Admin Routes (Sanctum + Admin Middleware)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // Dashboard Telemetry
    Route::get('/dashboard/stats', [SettingController::class, 'dashboardStats']);

    // Products Management
    Route::get('/products', [AdminProductController::class, 'index']);
    Route::post('/products', [AdminProductController::class, 'store']);
    Route::get('/products/{id}', [AdminProductController::class, 'show']);
    Route::put('/products/{id}', [AdminProductController::class, 'update']);
    Route::delete('/products/{id}', [AdminProductController::class, 'destroy']);
    Route::get('/products/low-stock', [ProductController::class, 'lowStock']);

    // Inventory Management
    Route::post('/products/{id}/inventory/add', [AdminInventoryController::class, 'addInventory']);
    Route::post('/products/{id}/inventory/remove', [AdminInventoryController::class, 'removeInventory']);
    Route::get('/products/{id}/inventory/history', [AdminInventoryController::class, 'history']);

    // Orders Management
    Route::get('/orders', [OrderController::class, 'adminIndex']);
    Route::put('/orders/{id}/status', [OrderController::class, 'updateStatus']);

    // Payment Audit & Refund
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::get('/payments/{id}', [PaymentController::class, 'show']);
    Route::post('/payments/{id}/refund', [PaymentController::class, 'refund']);

    // CarryBee Courier Deliveries
    Route::get('/deliveries', [DeliveryController::class, 'index']);
    Route::post('/deliveries/book/{orderId}', [DeliveryController::class, 'triggerDelivery']);

    // Settings
    Route::get('/settings', [SettingController::class, 'index']);
    Route::post('/settings', [SettingController::class, 'update']);
});

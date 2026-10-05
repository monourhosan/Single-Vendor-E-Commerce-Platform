<?php

namespace App\Providers;

use App\Events\OrderCreated;
use App\Events\PaymentCompleted;
use App\Listeners\CreateDeliveryAfterPayment;
use App\Listeners\UpdateInventory;
use App\Listeners\UpdateInventoryAfterOrder;
use App\Services\Payment\BkashService;
use App\Services\Payment\PaymentGatewayInterface;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind default PaymentGatewayInterface implementation
        $this->app->bind(
            PaymentGatewayInterface::class,
            BkashService::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);

        // Register application event listeners
        Event::listen(
            OrderCreated::class,
            UpdateInventoryAfterOrder::class,
        );

        Event::listen(
            PaymentCompleted::class,
            CreateDeliveryAfterPayment::class,
        );

        Event::listen(
            PaymentCompleted::class,
            UpdateInventory::class,
        );
    }
}

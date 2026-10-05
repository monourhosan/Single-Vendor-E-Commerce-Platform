<?php

namespace App\Listeners;

use App\Events\PaymentCompleted;
use App\Jobs\CreateCarryBeeDeliveryJob;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class CreateDeliveryAfterPayment implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(PaymentCompleted $event): void
    {
        Log::info("Payment completed for Order {$event->order->order_number}. Dispatching CarryBee delivery job.");

        // Dispatch background job to create delivery with CarryBee
        CreateCarryBeeDeliveryJob::dispatch($event->order);
    }
}

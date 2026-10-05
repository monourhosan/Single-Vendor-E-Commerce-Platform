<?php

namespace App\Listeners;

use App\Events\OrderCreated;
use App\Models\InventoryLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class UpdateInventoryAfterOrder implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event when an order is created.
     */
    public function handle(OrderCreated $event): void
    {
        Log::info("Processing inventory update after OrderCreated: {$event->order->order_number}");

        // Inventory is reserved atomically during OrderService::createOrder.
        // This listener ensures any asynchronous logging or post-order telemetry is finalized.
        InventoryLog::where('reference_id', $event->order->order_number)
            ->where('type', 'reservation')
            ->update(['created_at' => now()]);
    }
}

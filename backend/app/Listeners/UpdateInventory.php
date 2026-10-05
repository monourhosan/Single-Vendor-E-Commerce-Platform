<?php

namespace App\Listeners;

use App\Events\PaymentCompleted;
use App\Models\InventoryLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class UpdateInventory implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(PaymentCompleted $event): void
    {
        Log::info("Finalizing inventory confirmation for paid Order: {$event->order->order_number}");

        // Update any pending reservation logs to 'purchase' confirmation
        InventoryLog::where('reference_id', $event->order->order_number)
            ->where('type', 'reservation')
            ->update(['type' => 'purchase']);
    }
}

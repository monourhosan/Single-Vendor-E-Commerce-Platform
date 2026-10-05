<?php

namespace App\Jobs;

use App\Models\Delivery;
use App\Services\Delivery\CarryBeeService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncDeliveryStatusJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 120;

    /**
     * Execute the job.
     */
    public function handle(CarryBeeService $carryBeeService): void
    {
        Log::info("Running scheduled CarryBee delivery status synchronization.");

        $deliveries = Delivery::whereNotIn('status', ['delivered', 'returned', 'cancelled'])
            ->whereNotNull('tracking_number')
            ->limit(50)
            ->get();

        foreach ($deliveries as $delivery) {
            try {
                $trackingResult = $carryBeeService->trackDelivery($delivery->tracking_number);

                if (!empty($trackingResult['status']) && $trackingResult['status'] !== $delivery->status) {
                    $delivery->status = $trackingResult['status'];
                    $delivery->response = array_merge((array) $delivery->response, ['latest_sync' => $trackingResult]);
                    $delivery->save();

                    // Update corresponding order status
                    if ($delivery->status === 'delivered') {
                        $delivery->order->update(['order_status' => 'delivered']);
                    } elseif ($delivery->status === 'in_transit') {
                        $delivery->order->update(['order_status' => 'shipped']);
                    }
                }
            } catch (\Exception $e) {
                Log::warning("Could not sync delivery status for ID {$delivery->id}: " . $e->getMessage());
            }
        }
    }
}

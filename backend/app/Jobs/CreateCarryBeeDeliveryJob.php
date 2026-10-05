<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\Delivery\CarryBeeService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CreateCarryBeeDeliveryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public Order $order;
    public int $tries = 3;
    public int $timeout = 60;

    /**
     * Create a new job instance.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Execute the job.
     */
    public function handle(CarryBeeService $carryBeeService): void
    {
        Log::info("Starting CarryBee delivery booking for Order #{$this->order->order_number}");

        try {
            $delivery = $carryBeeService->createDelivery($this->order);
            Log::info("CarryBee Consignment created successfully: {$delivery->consignment_id}, Tracking: {$delivery->tracking_number}");
        } catch (\Exception $e) {
            Log::error("Failed to book CarryBee delivery for Order #{$this->order->order_number}: " . $e->getMessage());
            throw $e;
        }
    }
}

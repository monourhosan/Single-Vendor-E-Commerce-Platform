<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentCompleted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Order $order;
    public string $transactionId;
    public array $responsePayload;

    public function __construct(Order $order, string $transactionId, array $responsePayload = [])
    {
        $this->order = $order;
        $this->transactionId = $transactionId;
        $this->responsePayload = $responsePayload;
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $items = $this->items ?? collect([]);

        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'customer_name' => $this->customer_name,
            'customer_email' => $this->customer_email,
            'customer_phone' => $this->customer_phone,
            'delivery_address' => $this->delivery_address,
            'subtotal' => (float) $this->subtotal,
            'shipping_cost' => (float) $this->shipping_cost,
            'total' => (float) $this->total,
            'payment_status' => $this->payment_status,
            'order_status' => $this->order_status,
            'items' => OrderItemResource::collection($items),
            'payment' => $this->latestPayment ? new PaymentResource($this->latestPayment) : null,
            'delivery' => $this->delivery ? new DeliveryResource($this->delivery) : null,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

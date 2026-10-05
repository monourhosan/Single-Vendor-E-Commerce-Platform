<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Services\Delivery\CarryBeeService;
use App\Services\OrderService;
use Tests\TestCase;

class CarryBeeServiceTest extends TestCase
{
    public function test_carrybee_creates_consignment_for_order(): void
    {
        $product = Product::create([
            'name' => 'Courier Item',
            'sku' => 'CRB-001',
            'price' => 1200.00,
            'stock_quantity' => 10,
            'status' => 'active',
        ]);

        $order = app(OrderService::class)->createOrder([
            'customer_name' => 'Mushfiqur Rahim',
            'customer_email' => 'mushfiq@example.com',
            'customer_phone' => '01912000000',
            'delivery_address' => 'Uttara Sector 3, Dhaka',
        ], [
            ['product_id' => $product->id, 'quantity' => 1],
        ]);

        $carryBeeService = app(CarryBeeService::class);
        $delivery = $carryBeeService->createDelivery($order);

        $this->assertNotNull($delivery->consignment_id);
        $this->assertNotNull($delivery->tracking_number);
        $this->assertEquals('carrybee', $delivery->courier);
        $this->assertDatabaseHas('deliveries', [
            'order_id' => $order->id,
            'courier' => 'carrybee',
        ]);
    }

    public function test_carrybee_tracking_returns_timeline(): void
    {
        $carryBeeService = app(CarryBeeService::class);
        $trackingResult = $carryBeeService->trackDelivery('CB-TRK-TEST12345');

        $this->assertTrue($trackingResult['success']);
        $this->assertNotEmpty($trackingResult['timeline']);
    }
}

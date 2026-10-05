<?php

namespace Tests\Unit;

use App\Events\OrderCreated;
use App\Events\PaymentCompleted;
use App\Models\Order;
use App\Models\Product;
use App\Services\OrderService;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class OrderServiceTest extends TestCase
{
    protected OrderService $orderService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->orderService = app(OrderService::class);
    }

    public function test_creates_order_and_dispatches_order_created_event(): void
    {
        Event::fake([OrderCreated::class]);

        $product = Product::create([
            'name' => 'Order Service Item',
            'sku' => 'ORD-SRV-1',
            'price' => 500.00,
            'stock_quantity' => 10,
            'status' => 'active',
        ]);

        $order = $this->orderService->createOrder([
            'customer_name' => 'Nazmul Hossain',
            'customer_email' => 'nazmul@example.com',
            'customer_phone' => '01912345678',
            'delivery_address' => 'Gulshan, Dhaka',
            'shipping_cost' => 60.00,
        ], [
            ['product_id' => $product->id, 'quantity' => 2],
        ]);

        $this->assertInstanceOf(Order::class, $order);
        $this->assertEquals(1060.00, (float) $order->total);
        $this->assertEquals('pending', $order->order_status);

        Event::assertDispatched(OrderCreated::class, function ($event) use ($order) {
            return $event->order->id === $order->id;
        });
    }

    public function test_mark_as_paid_updates_status_and_dispatches_payment_completed(): void
    {
        Event::fake([PaymentCompleted::class]);

        $product = Product::create([
            'name' => 'Paid Item',
            'sku' => 'PAID-001',
            'price' => 1000.00,
            'stock_quantity' => 5,
            'status' => 'active',
        ]);

        $order = $this->orderService->createOrder([
            'customer_name' => 'Kazi Anis',
            'customer_email' => 'anis@example.com',
            'customer_phone' => '01700000000',
            'delivery_address' => 'Mirpur, Dhaka',
        ], [
            ['product_id' => $product->id, 'quantity' => 1],
        ]);

        $this->orderService->markAsPaid($order, 'bkash', 'TRX_TEST_12345', ['status' => 'Completed']);

        $this->assertEquals('paid', $order->fresh()->payment_status);
        $this->assertEquals('processing', $order->fresh()->order_status);

        Event::assertDispatched(PaymentCompleted::class, function ($event) use ($order) {
            return $event->order->id === $order->id && $event->transactionId === 'TRX_TEST_12345';
        });
    }

    public function test_update_order_status(): void
    {
        $product = Product::create([
            'name' => 'Status Item',
            'sku' => 'STS-001',
            'price' => 400.00,
            'stock_quantity' => 5,
            'status' => 'active',
        ]);

        $order = $this->orderService->createOrder([
            'customer_name' => 'Fahim Ahmed',
            'customer_email' => 'fahim@example.com',
            'customer_phone' => '01600000000',
            'delivery_address' => 'Uttara, Dhaka',
        ], [
            ['product_id' => $product->id, 'quantity' => 1],
        ]);

        $updatedOrder = $this->orderService->updateOrderStatus($order, 'shipped');

        $this->assertEquals('shipped', $updatedOrder->order_status);
    }
}

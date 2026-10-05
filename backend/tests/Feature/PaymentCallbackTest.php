<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Services\OrderService;
use Tests\TestCase;

class PaymentCallbackTest extends TestCase
{
    public function test_bkash_callback_success_updates_order_status(): void
    {
        $product = Product::create([
            'name' => 'Callback Product',
            'sku' => 'CB-001',
            'price' => 1000.00,
            'stock_quantity' => 5,
            'status' => 'active',
        ]);

        $order = app(OrderService::class)->createOrder([
            'customer_name' => 'Sakib Hasan',
            'customer_email' => 'sakib@example.com',
            'customer_phone' => '01712000000',
            'delivery_address' => 'Banani, Dhaka',
        ], [
            ['product_id' => $product->id, 'quantity' => 1],
        ]);

        $payment = Payment::create([
            'order_id' => $order->id,
            'gateway' => 'bkash',
            'transaction_id' => 'BKASH_TEST_PAYMENT_ID',
            'amount' => $order->total,
            'status' => 'initiated',
            'response_payload' => ['paymentID' => 'BKASH_TEST_PAYMENT_ID'],
        ]);

        $response = $this->get('/api/payment/bkash/callback?paymentID=BKASH_TEST_PAYMENT_ID&status=success');

        $response->assertRedirect();
        $this->assertEquals('paid', $order->fresh()->payment_status);
        $this->assertEquals('processing', $order->fresh()->order_status);
    }

    public function test_bkash_callback_cancel_restores_inventory(): void
    {
        $product = Product::create([
            'name' => 'Cancel Item',
            'sku' => 'CB-002',
            'price' => 800.00,
            'stock_quantity' => 5,
            'status' => 'active',
        ]);

        $order = app(OrderService::class)->createOrder([
            'customer_name' => 'Tamim Iqbal',
            'customer_email' => 'tamim@example.com',
            'customer_phone' => '01812000000',
            'delivery_address' => 'Chittagong',
        ], [
            ['product_id' => $product->id, 'quantity' => 2],
        ]);

        Payment::create([
            'order_id' => $order->id,
            'gateway' => 'bkash',
            'transaction_id' => 'BKASH_CANCEL_PAYMENT_ID',
            'amount' => $order->total,
            'status' => 'initiated',
        ]);

        $response = $this->get('/api/payment/bkash/callback?paymentID=BKASH_CANCEL_PAYMENT_ID&status=cancel');

        $response->assertRedirect();
        $this->assertEquals('failed', $order->fresh()->payment_status);
        $this->assertEquals(5, $product->fresh()->stock_quantity); // Restored
    }
}

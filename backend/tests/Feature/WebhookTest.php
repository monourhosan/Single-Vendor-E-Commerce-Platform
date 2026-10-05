<?php

namespace Tests\Feature;

use App\Models\Delivery;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Services\OrderService;
use Tests\TestCase;

class WebhookTest extends TestCase
{
    public function test_carrybee_webhook_updates_delivery_and_order_status(): void
    {
        $product = Product::create([
            'name' => 'Webhook Product',
            'sku' => 'WB-001',
            'price' => 1500.00,
            'stock_quantity' => 10,
            'status' => 'active',
        ]);

        $order = app(OrderService::class)->createOrder([
            'customer_name' => 'Liton Das',
            'customer_email' => 'liton@example.com',
            'customer_phone' => '01712345678',
            'delivery_address' => 'Dinajpur',
        ], [
            ['product_id' => $product->id, 'quantity' => 1],
        ]);

        $delivery = Delivery::create([
            'order_id' => $order->id,
            'courier' => 'carrybee',
            'consignment_id' => 'CB-CON-9999',
            'tracking_number' => 'CB-TRK-9999',
            'status' => 'booked',
        ]);

        $response = $this->postJson('/api/deliveries/webhook/carrybee', [
            'consignment_id' => 'CB-CON-9999',
            'tracking_number' => 'CB-TRK-9999',
            'status' => 'delivered',
            'note' => 'Delivered to customer doorstep',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertEquals('delivered', $delivery->fresh()->status);
        $this->assertEquals('completed', $order->fresh()->order_status);
    }

    public function test_bkash_webhook_completes_payment(): void
    {
        $product = Product::create([
            'name' => 'bKash Webhook Product',
            'sku' => 'BK-WB-1',
            'price' => 2000.00,
            'stock_quantity' => 5,
            'status' => 'active',
        ]);

        $order = app(OrderService::class)->createOrder([
            'customer_name' => 'Mushfiqur Rahim',
            'customer_email' => 'mushfiq@example.com',
            'customer_phone' => '01799999999',
            'delivery_address' => 'Bogra',
        ], [
            ['product_id' => $product->id, 'quantity' => 1],
        ]);

        $payment = Payment::create([
            'order_id' => $order->id,
            'gateway' => 'bkash',
            'transaction_id' => 'BKASH_HOOK_ID_123',
            'amount' => $order->total,
            'status' => 'initiated',
            'response_payload' => ['paymentID' => 'BKASH_HOOK_ID_123'],
        ]);

        $response = $this->postJson('/api/payment/bkash/webhook', [
            'paymentID' => 'BKASH_HOOK_ID_123',
            'trxID' => 'TRX_HOOK_98765',
            'transactionStatus' => 'Completed',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('paid', $order->fresh()->payment_status);
    }

    public function test_sslcommerz_ipn_completes_payment(): void
    {
        $product = Product::create([
            'name' => 'SSLC Webhook Product',
            'sku' => 'SSLC-WB-1',
            'price' => 3000.00,
            'stock_quantity' => 5,
            'status' => 'active',
        ]);

        $order = app(OrderService::class)->createOrder([
            'customer_name' => 'Mahmudullah Riyad',
            'customer_email' => 'riyad@example.com',
            'customer_phone' => '01899999999',
            'delivery_address' => 'Mymensingh',
        ], [
            ['product_id' => $product->id, 'quantity' => 1],
        ]);

        $response = $this->postJson('/api/payment/sslcommerz/ipn', [
            'tran_id' => $order->order_number,
            'val_id' => 'SIMULATED_VAL_123',
            'status' => 'VALID',
            'amount' => (string) $order->total,
            'bank_tran_id' => 'BANK_TRX_5555',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('paid', $order->fresh()->payment_status);
    }
}

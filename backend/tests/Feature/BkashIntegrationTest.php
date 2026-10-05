<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class BkashIntegrationTest extends TestCase
{
    public function test_checkout_with_deferred_payment_creates_order_for_nextjs_flow(): void
    {
        $product = Product::create([
            'name' => 'Next bKash Item',
            'sku' => 'NBK-001',
            'price' => 1200.00,
            'stock_quantity' => 10,
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/checkout', [
            'customer_name' => 'Shakib Al Hasan',
            'customer_email' => 'shakib@example.com',
            'customer_phone' => '01712345678',
            'delivery_address' => 'Magura Town',
            'payment_gateway' => 'bkash',
            'defer_payment' => true,
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2],
            ],
            'shipping_cost' => 60,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $orderNumber = $response->json('order_number');
        $this->assertNotEmpty($orderNumber);

        $order = Order::where('order_number', $orderNumber)->first();
        $this->assertNotNull($order);
        $this->assertEquals('pending', $order->payment_status);
        $this->assertEquals(2460.00, (float) $order->total);
        // Stock reserved (10 - 2 = 8)
        $this->assertEquals(8, $product->fresh()->stock_quantity);
    }

    public function test_bkash_initiate_creates_payment_record(): void
    {
        $product = Product::create([
            'name' => 'Test Item 2',
            'sku' => 'NBK-002',
            'price' => 500.00,
            'stock_quantity' => 5,
            'status' => 'active',
        ]);

        $order = app(OrderService::class)->createOrder([
            'customer_name' => 'Tamim Iqbal',
            'customer_email' => 'tamim@example.com',
            'customer_phone' => '01812345678',
            'delivery_address' => 'Chittagong',
        ], [
            ['product_id' => $product->id, 'quantity' => 1],
        ]);

        $response = $this->postJson('/api/payment/bkash/initiate', [
            'paymentID' => 'BKASH_PAY_TEST_999',
            'order_number' => $order->order_number,
            'amount' => $order->total,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $payment = Payment::where('transaction_id', 'BKASH_PAY_TEST_999')->first();
        $this->assertNotNull($payment);
        $this->assertEquals('initiated', $payment->status);
        $this->assertEquals($order->id, $payment->order_id);
    }

    public function test_bkash_verify_completes_payment_and_triggers_delivery(): void
    {
        $product = Product::create([
            'name' => 'Test Item 3',
            'sku' => 'NBK-003',
            'price' => 3000.00,
            'stock_quantity' => 4,
            'status' => 'active',
        ]);

        $order = app(OrderService::class)->createOrder([
            'customer_name' => 'Mashrafe Mortaza',
            'customer_email' => 'mashrafe@example.com',
            'customer_phone' => '01912345678',
            'delivery_address' => 'Narail',
        ], [
            ['product_id' => $product->id, 'quantity' => 1],
        ]);

        $response = $this->postJson('/api/payment/bkash/verify', [
            'paymentID' => 'BKASH_PAY_TEST_888',
            'trxID' => 'TRX_BKASH_SUCCESS_777',
            'orderID' => $order->order_number,
            'amount' => (string) $order->total,
            'status' => 'Completed',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertEquals('paid', $order->fresh()->payment_status);
        $this->assertEquals('processing', $order->fresh()->order_status);

        // Idempotency: call again with same details
        $duplicateResponse = $this->postJson('/api/payment/bkash/verify', [
            'paymentID' => 'BKASH_PAY_TEST_888',
            'trxID' => 'TRX_BKASH_SUCCESS_777',
            'orderID' => $order->order_number,
            'amount' => (string) $order->total,
            'status' => 'Completed',
        ]);

        $duplicateResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('idempotent', true);
    }

    public function test_bkash_failed_restores_inventory(): void
    {
        $product = Product::create([
            'name' => 'Test Item 4',
            'sku' => 'NBK-004',
            'price' => 700.00,
            'stock_quantity' => 10,
            'status' => 'active',
        ]);

        $order = app(OrderService::class)->createOrder([
            'customer_name' => 'Taskin Ahmed',
            'customer_email' => 'taskin@example.com',
            'customer_phone' => '01512345678',
            'delivery_address' => 'Dhaka',
        ], [
            ['product_id' => $product->id, 'quantity' => 3],
        ]);

        // Stock reserved: 10 - 3 = 7
        $this->assertEquals(7, $product->fresh()->stock_quantity);

        $response = $this->postJson('/api/payment/bkash/failed', [
            'order_number' => $order->order_number,
            'reason' => 'Customer cancelled at bKash PIN window',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertEquals('failed', $order->fresh()->payment_status);
        $this->assertEquals('cancelled', $order->fresh()->order_status);
        // Stock restored back to 10
        $this->assertEquals(10, $product->fresh()->stock_quantity);
    }

    public function test_admin_can_refund_payment(): void
    {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin_test@shoplagbe.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        $product = Product::create([
            'name' => 'Refundable Item',
            'sku' => 'REF-001',
            'price' => 1000.00,
            'stock_quantity' => 5,
            'status' => 'active',
        ]);

        $order = app(OrderService::class)->createOrder([
            'customer_name' => 'Mustafizur Rahman',
            'customer_email' => 'mustafiz@example.com',
            'customer_phone' => '01312345678',
            'delivery_address' => 'Satkhira',
        ], [
            ['product_id' => $product->id, 'quantity' => 1],
        ]);

        app(OrderService::class)->markAsPaid($order, 'bkash', 'TRX_TO_REFUND_111');

        $payment = Payment::where('transaction_id', 'TRX_TO_REFUND_111')->first();
        $this->assertNotNull($payment);

        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/admin/payments/{$payment->id}/refund", [
            'refundTrxID' => 'REF_BKASH_9999',
            'reason' => 'Defective item customer refund',
            'amount' => $payment->amount,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertEquals('refunded', $payment->fresh()->status);
        $this->assertEquals('refunded', $order->fresh()->payment_status);
    }
}

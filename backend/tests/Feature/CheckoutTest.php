<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Support\Facades\Queue;
use App\Jobs\CreateCarryBeeDeliveryJob;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    public function test_checkout_with_cash_on_delivery(): void
    {
        Queue::fake();

        $product = Product::create([
            'name' => 'Checkout Item',
            'sku' => 'CHK-001',
            'price' => 500.00,
            'stock_quantity' => 10,
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/checkout', [
            'customer_name' => 'Tanvir Hasan',
            'customer_email' => 'tanvir@gmail.com',
            'customer_phone' => '01712345678',
            'delivery_address' => 'Mirpur-10, Dhaka',
            'payment_gateway' => 'cod',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('order.customer_name', 'Tanvir Hasan');

        // Stock decreased to 8
        $this->assertEquals(8, $product->fresh()->stock_quantity);

        // Queue job dispatched
        Queue::assertPushed(CreateCarryBeeDeliveryJob::class);
    }

    public function test_checkout_validation_fails_on_invalid_phone(): void
    {
        $response = $this->postJson('/api/checkout', [
            'customer_name' => 'Invalid Phone User',
            'customer_email' => 'invalid@phone.com',
            'customer_phone' => '123456',
            'delivery_address' => 'Dhaka',
            'payment_gateway' => 'bkash',
            'items' => [
                ['product_id' => 1, 'quantity' => 1],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['customer_phone']);
    }
}

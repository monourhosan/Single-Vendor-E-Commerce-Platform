<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Services\InventoryService;
use App\Services\OrderService;
use Tests\TestCase;
use Exception;

class InventoryTest extends TestCase
{
    public function test_inventory_deducts_and_creates_audit_log(): void
    {
        $product = Product::create([
            'name' => 'Inventory Item',
            'sku' => 'INV-001',
            'price' => 50.00,
            'stock_quantity' => 10,
            'status' => 'active',
        ]);

        $service = app(InventoryService::class);
        $service->reserveStock([['product_id' => $product->id, 'quantity' => 3]], 'ORD-TEST-123');

        $this->assertEquals(7, $product->fresh()->stock_quantity);

        $this->assertDatabaseHas('inventory_logs', [
            'product_id' => $product->id,
            'quantity_change' => -3,
            'reference_id' => 'ORD-TEST-123',
        ]);
    }

    public function test_cannot_purchase_beyond_available_stock(): void
    {
        $this->expectException(Exception::class);

        $product = Product::create([
            'name' => 'Low Stock Product',
            'sku' => 'INV-002',
            'price' => 100.00,
            'stock_quantity' => 2,
            'status' => 'active',
        ]);

        $service = app(InventoryService::class);
        // Attempt to reserve 5 items when only 2 exist
        $service->reserveStock([['product_id' => $product->id, 'quantity' => 5]], 'ORD-OVERSTOCK');
    }

    public function test_failed_order_restores_reserved_stock(): void
    {
        $product = Product::create([
            'name' => 'Rollback Item',
            'sku' => 'INV-003',
            'price' => 200.00,
            'stock_quantity' => 10,
            'status' => 'active',
        ]);

        $orderService = app(OrderService::class);

        $order = $orderService->createOrder([
            'customer_name' => 'Test Customer',
            'customer_email' => 'test@customer.com',
            'customer_phone' => '01711112233',
            'delivery_address' => 'House 1, Road 2, Dhaka',
        ], [
            ['product_id' => $product->id, 'quantity' => 4],
        ]);

        // Stock decreased to 6
        $this->assertEquals(6, $product->fresh()->stock_quantity);

        // Cancel order / payment failed
        $orderService->markAsFailed($order);

        // Stock restored back to 10
        $this->assertEquals(10, $product->fresh()->stock_quantity);
    }
}

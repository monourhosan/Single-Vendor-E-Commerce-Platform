<?php

namespace Tests\Unit;

use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\Product;
use App\Services\InventoryService;
use App\Services\OrderService;
use Tests\TestCase;

class InventoryServiceTest extends TestCase
{
    protected InventoryService $inventoryService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->inventoryService = app(InventoryService::class);
    }

    public function test_reserves_stock_and_creates_audit_log(): void
    {
        $product = Product::create([
            'name' => 'Inventory Unit Item',
            'sku' => 'INV-UNT-1',
            'price' => 300.00,
            'stock_quantity' => 20,
            'status' => 'active',
        ]);

        $this->inventoryService->reserveStock([
            ['product_id' => $product->id, 'quantity' => 4],
        ], 'REF-UNIT-001');

        $this->assertEquals(16, $product->fresh()->stock_quantity);
        $this->assertDatabaseHas('inventory_logs', [
            'product_id' => $product->id,
            'quantity_change' => -4,
            'type' => 'reservation',
            'reference_id' => 'REF-UNIT-001',
        ]);
    }

    public function test_restocks_product_with_audit_trail(): void
    {
        $product = Product::create([
            'name' => 'Restock Item',
            'sku' => 'INV-RST-1',
            'price' => 150.00,
            'stock_quantity' => 5,
            'status' => 'active',
        ]);

        $this->inventoryService->restock($product->id, 10, 'supplier_shipment');

        $this->assertEquals(15, $product->fresh()->stock_quantity);
        $this->assertDatabaseHas('inventory_logs', [
            'product_id' => $product->id,
            'quantity_change' => 10,
            'type' => 'supplier_shipment',
        ]);
    }

    public function test_cannot_reserve_insufficient_stock(): void
    {
        $this->expectException(\Exception::class);

        $product = Product::create([
            'name' => 'Low Stock Product',
            'sku' => 'INV-ERR-1',
            'price' => 200.00,
            'stock_quantity' => 2,
            'status' => 'active',
        ]);

        $this->inventoryService->reserveStock([
            ['product_id' => $product->id, 'quantity' => 5],
        ], 'REF-FAIL-001');
    }
}

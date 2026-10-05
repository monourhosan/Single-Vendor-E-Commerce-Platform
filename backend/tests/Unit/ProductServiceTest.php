<?php

namespace Tests\Unit;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\ProductService;
use Tests\TestCase;

class ProductServiceTest extends TestCase
{
    protected ProductService $productService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->productService = app(ProductService::class);
    }

    public function test_can_create_product(): void
    {
        $product = $this->productService->createProduct([
            'name' => 'Premium Wireless Headphones',
            'price' => 2500.00,
            'stock_quantity' => 15,
            'status' => 'active',
            'description' => 'High fidelity sound with ANC',
        ]);

        $this->assertInstanceOf(Product::class, $product);
        $this->assertDatabaseHas('products', ['name' => 'Premium Wireless Headphones']);
        $this->assertNotEmpty($product->slug);
        $this->assertNotEmpty($product->sku);
    }

    public function test_can_find_product_by_id_or_slug(): void
    {
        $product = Product::create([
            'name' => 'Mechanical Keyboard',
            'slug' => 'mechanical-keyboard-mk1',
            'sku' => 'KB-MK1',
            'price' => 4500.00,
            'stock_quantity' => 8,
            'status' => 'active',
        ]);

        $foundById = $this->productService->findProduct($product->id);
        $foundBySlug = $this->productService->findProduct('mechanical-keyboard-mk1');

        $this->assertEquals($product->id, $foundById->id);
        $this->assertEquals($product->id, $foundBySlug->id);
    }

    public function test_soft_archives_product_when_orders_exist(): void
    {
        $product = Product::create([
            'name' => 'Ordered Item',
            'sku' => 'ORD-ITM-1',
            'price' => 1200.00,
            'stock_quantity' => 10,
            'status' => 'active',
        ]);

        $order = Order::create([
            'order_number' => 'ORD-TEST-123456',
            'customer_name' => 'Rahim Ali',
            'customer_email' => 'rahim@example.com',
            'customer_phone' => '01711111111',
            'delivery_address' => 'Dhanmondi, Dhaka',
            'subtotal' => 1200.00,
            'shipping_cost' => 60.00,
            'total' => 1260.00,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'price' => 1200.00,
            'subtotal' => 1200.00,
        ]);

        $result = $this->productService->deleteProduct($product);

        $this->assertTrue($result['archived']);
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'status' => 'archived',
        ]);
    }

    public function test_retrieves_low_stock_products(): void
    {
        Product::create([
            'name' => 'High Stock Item',
            'sku' => 'STK-HIGH',
            'price' => 500.00,
            'stock_quantity' => 50,
            'status' => 'active',
        ]);

        Product::create([
            'name' => 'Low Stock Item',
            'sku' => 'STK-LOW',
            'price' => 750.00,
            'stock_quantity' => 2,
            'status' => 'active',
        ]);

        $lowStock = $this->productService->getLowStockProducts(5);

        $this->assertCount(1, $lowStock);
        $this->assertEquals('STK-LOW', $lowStock->first()->sku);
    }
}

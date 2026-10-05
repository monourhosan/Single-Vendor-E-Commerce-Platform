<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use App\Models\Order;
use App\Models\OrderItem;
use Tests\TestCase;

class AdminProductInventoryTest extends TestCase
{
    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::create([
            'name' => 'Admin Tester',
            'email' => 'admintester_' . uniqid() . '@shoplagbe.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'admin',
        ]);
    }

    public function test_admin_can_create_product_with_validation(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Test Gaming Mouse',
            'sku' => 'MS-TEST-001',
            'price' => 2500.00,
            'stock_quantity' => 20,
            'status' => 'active',
            'description' => 'High precision optical mouse',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Test Gaming Mouse',
                    'sku' => 'MS-TEST-001',
                    'price' => 2500.00,
                    'stock_quantity' => 20,
                ],
            ]);

        $this->assertDatabaseHas('products', [
            'sku' => 'MS-TEST-001',
            'name' => 'Test Gaming Mouse',
        ]);
    }

    public function test_create_product_fails_with_negative_stock_or_zero_price(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Invalid Product',
            'sku' => 'INV-NEG-001',
            'price' => 0,
            'stock_quantity' => -5,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['price', 'stock_quantity']);
    }

    public function test_create_product_fails_with_duplicate_sku(): void
    {
        Product::create([
            'name' => 'First Product',
            'sku' => 'DUPLICATE-SKU',
            'price' => 100.00,
            'stock_quantity' => 5,
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')->postJson('/api/admin/products', [
            'name' => 'Second Product',
            'sku' => 'DUPLICATE-SKU',
            'price' => 150.00,
            'stock_quantity' => 10,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['sku']);
    }

    public function test_admin_can_update_product_and_preserve_sku(): void
    {
        $product = Product::create([
            'name' => 'Initial Name',
            'sku' => 'SKU-KEEP-1',
            'price' => 1200.00,
            'stock_quantity' => 15,
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')->putJson("/api/admin/products/{$product->id}", [
            'name' => 'Updated Name',
            'sku' => 'SKU-KEEP-1', // keeping same SKU must be valid
            'price' => 1350.00,
            'status' => 'inactive',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Updated Name',
                    'price' => 1350.00,
                    'status' => 'inactive',
                ],
            ]);
    }

    public function test_admin_can_safely_delete_product_with_soft_deletes(): void
    {
        $product = Product::create([
            'name' => 'Delete Me Product',
            'sku' => 'DEL-001',
            'price' => 500.00,
            'stock_quantity' => 5,
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')->deleteJson("/api/admin/products/{$product->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        // Product should be soft-deleted
        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }

    public function test_delete_product_with_existing_orders_archives_and_soft_deletes(): void
    {
        $product = Product::create([
            'name' => 'Ordered Product',
            'sku' => 'ORD-DEL-001',
            'price' => 500.00,
            'stock_quantity' => 5,
            'status' => 'active',
        ]);

        $order = Order::create([
            'order_number' => 'ORD-TEST-SAFE',
            'customer_name' => 'John Doe',
            'customer_email' => 'john@example.com',
            'customer_phone' => '01700000000',
            'delivery_address' => 'Dhaka',
            'subtotal' => 500,
            'shipping_cost' => 60,
            'total' => 560,
            'payment_status' => 'paid',
            'order_status' => 'processing',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'price' => 500,
            'quantity' => 1,
            'subtotal' => 500,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')->deleteJson("/api/admin/products/{$product->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'archived' => true,
            ]);

        $this->assertSoftDeleted('products', ['id' => $product->id]);
        $this->assertEquals('archived', Product::withTrashed()->find($product->id)->status);
    }

    public function test_admin_can_add_inventory_and_logs_are_created(): void
    {
        $product = Product::create([
            'name' => 'Restock Product',
            'sku' => 'RESTOCK-001',
            'price' => 1000.00,
            'stock_quantity' => 10,
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')->postJson("/api/admin/products/{$product->id}/inventory/add", [
            'action' => 'ADD',
            'quantity' => 15,
            'reason' => 'Supplier shipment batch 44',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'stock_quantity' => 25,
                ],
            ]);

        $this->assertEquals(25, $product->fresh()->stock_quantity);

        $this->assertDatabaseHas('inventory_logs', [
            'product_id' => $product->id,
            'quantity_change' => 15,
            'previous_quantity' => 10,
            'new_quantity' => 25,
            'type' => 'restock',
            'reason' => 'Supplier shipment batch 44',
            'user_id' => $this->adminUser->id,
        ]);
    }

    public function test_admin_can_remove_inventory_and_logs_are_created(): void
    {
        $product = Product::create([
            'name' => 'Deduct Product',
            'sku' => 'DEDUCT-001',
            'price' => 1000.00,
            'stock_quantity' => 20,
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')->postJson("/api/admin/products/{$product->id}/inventory/remove", [
            'action' => 'REMOVE',
            'quantity' => 5,
            'reason' => 'Damaged in warehouse storage',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'stock_quantity' => 15,
                ],
            ]);

        $this->assertEquals(15, $product->fresh()->stock_quantity);

        $this->assertDatabaseHas('inventory_logs', [
            'product_id' => $product->id,
            'quantity_change' => -5,
            'previous_quantity' => 20,
            'new_quantity' => 15,
            'type' => 'manual_deduction',
            'reason' => 'Damaged in warehouse storage',
            'user_id' => $this->adminUser->id,
        ]);
    }

    public function test_cannot_remove_inventory_below_zero_stock(): void
    {
        $product = Product::create([
            'name' => 'Low Stock Item',
            'sku' => 'LOW-001',
            'price' => 1000.00,
            'stock_quantity' => 3,
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')->postJson("/api/admin/products/{$product->id}/inventory/remove", [
            'action' => 'REMOVE',
            'quantity' => 10, // attempting to remove 10 when only 3 in stock
            'reason' => 'Damaged',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);

        // Stock remains unchanged
        $this->assertEquals(3, $product->fresh()->stock_quantity);
    }

    public function test_admin_can_view_inventory_history(): void
    {
        $product = Product::create([
            'name' => 'History Product',
            'sku' => 'HIST-001',
            'price' => 500.00,
            'stock_quantity' => 10,
            'status' => 'active',
        ]);

        $this->actingAs($this->adminUser, 'sanctum')->postJson("/api/admin/products/{$product->id}/inventory/add", [
            'quantity' => 5,
            'reason' => 'First restock',
        ]);

        $this->actingAs($this->adminUser, 'sanctum')->postJson("/api/admin/products/{$product->id}/inventory/remove", [
            'quantity' => 2,
            'reason' => 'Customer sample',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')->getJson("/api/admin/products/{$product->id}/inventory/history");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'product' => [
                    'id' => $product->id,
                    'stock_quantity' => 13,
                ],
            ]);

        $this->assertCount(2, $response->json('data'));
    }
}

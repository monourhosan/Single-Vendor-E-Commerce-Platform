<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Tests\TestCase;

class ProductTest extends TestCase
{
    public function test_can_list_active_products(): void
    {
        Product::create([
            'name' => 'Active Item',
            'sku' => 'SKU-001',
            'price' => 100.00,
            'stock_quantity' => 10,
            'status' => 'active',
        ]);

        Product::create([
            'name' => 'Inactive Item',
            'sku' => 'SKU-002',
            'price' => 200.00,
            'stock_quantity' => 5,
            'status' => 'inactive',
        ]);

        $response = $this->getJson('/api/products');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }

    public function test_admin_can_create_product(): void
    {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@create.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        $response = $this->actingAs($admin)->postJson('/api/admin/products', [
            'name' => 'New Premium Product',
            'sku' => 'PRM-001',
            'description' => 'Test description',
            'price' => 1500.00,
            'stock_quantity' => 25,
            'status' => 'active',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.sku', 'PRM-001');

        $this->assertDatabaseHas('products', ['sku' => 'PRM-001']);
    }
}

<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_customer_can_register(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Demo User',
            'email' => 'demouser@example.com',
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['token', 'user' => ['id', 'email', 'role']]);

        $this->assertDatabaseHas('users', [
            'email' => 'demouser@example.com',
            'role' => 'customer',
        ]);
    }

    public function test_admin_can_login_via_admin_endpoint(): void
    {
        $admin = User::create([
            'name' => 'Admin Test',
            'email' => 'admin@test.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        $response = $this->postJson('/api/admin/login', [
            'email' => 'admin@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['token', 'user']);
    }

    public function test_regular_customer_cannot_login_as_admin(): void
    {
        User::create([
            'name' => 'Customer Test',
            'email' => 'customer@test.com',
            'password' => Hash::make('password123'),
            'role' => 'customer',
        ]);

        $response = $this->postJson('/api/admin/login', [
            'email' => 'customer@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(403);
    }
}

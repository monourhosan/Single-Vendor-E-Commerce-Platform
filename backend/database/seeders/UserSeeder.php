<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Admin Account
        User::updateOrCreate(
            ['email' => 'admin@shoplagbe.com'],
            [
                'name' => 'ShopLagbe Administrator',
                'password' => Hash::make('admin123456'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        // Demo Customer Account
        User::updateOrCreate(
            ['email' => 'customer@shoplagbe.com'],
            [
                'name' => 'Rahim Ahmed',
                'password' => Hash::make('customer123456'),
                'role' => 'customer',
                'email_verified_at' => now(),
            ]
        );
    }
}

<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // General business settings
            ['key' => 'store_name', 'value' => 'ShopLagbe E-Commerce', 'group' => 'general', 'type' => 'string', 'description' => 'Public store branding name'],
            ['key' => 'store_email', 'value' => 'support@shoplagbe.com', 'group' => 'general', 'type' => 'string', 'description' => 'Customer support email'],
            ['key' => 'store_phone', 'value' => '+880 1700-000000', 'group' => 'general', 'type' => 'string', 'description' => 'Customer support hotline'],
            ['key' => 'store_address', 'value' => 'Gulshan-2, Dhaka 1212, Bangladesh', 'group' => 'general', 'type' => 'string', 'description' => 'Registered business address'],

            // Delivery & Shipping configuration
            ['key' => 'default_shipping_cost', 'value' => '60', 'group' => 'delivery', 'type' => 'integer', 'description' => 'Base standard shipping fee (BDT)'],
            ['key' => 'shipping_inside_dhaka', 'value' => '60', 'group' => 'delivery', 'type' => 'integer', 'description' => 'Delivery rate inside Dhaka metropolitan'],
            ['key' => 'shipping_outside_dhaka', 'value' => '120', 'group' => 'delivery', 'type' => 'integer', 'description' => 'Delivery rate outside Dhaka'],
            ['key' => 'carrybee_base_url', 'value' => 'https://api.carrybee.com/v1', 'group' => 'delivery', 'type' => 'string', 'description' => 'CarryBee API endpoint'],
            ['key' => 'carrybee_client_id', 'value' => 'carrybee_sandbox_client_id', 'group' => 'delivery', 'type' => 'string', 'description' => 'CarryBee Client ID'],
            ['key' => 'carrybee_client_secret', 'value' => 'carrybee_sandbox_client_secret', 'group' => 'delivery', 'type' => 'string', 'description' => 'CarryBee Client Secret'],
            ['key' => 'carrybee_client_context', 'value' => 'ecommerce_sandbox', 'group' => 'delivery', 'type' => 'string', 'description' => 'CarryBee Client Context'],

            // Payment Gateways configuration
            ['key' => 'bkash_base_url', 'value' => 'https://tokenized.sandbox.bka.sh/v2.0', 'group' => 'payment', 'type' => 'string', 'description' => 'bKash tokenized sandbox endpoint'],
            ['key' => 'bkash_app_key', 'value' => 'sandbox_bkash_app_key_demo', 'group' => 'payment', 'type' => 'string', 'description' => 'bKash Sandbox App Key'],
            ['key' => 'bkash_app_secret', 'value' => 'sandbox_bkash_secret_demo_345678', 'group' => 'payment', 'type' => 'string', 'description' => 'bKash Sandbox App Secret'],
            ['key' => 'bkash_username', 'value' => 'sandbox_bkash_user', 'group' => 'payment', 'type' => 'string', 'description' => 'bKash Sandbox Username'],
            ['key' => 'bkash_password', 'value' => 'sandbox_bkash_password', 'group' => 'payment', 'type' => 'string', 'description' => 'bKash Sandbox Password'],

            ['key' => 'sslc_store_id', 'value' => 'testbox', 'group' => 'payment', 'type' => 'string', 'description' => 'SSLCommerz Store ID'],
            ['key' => 'sslc_store_password', 'value' => 'qwerty', 'group' => 'payment', 'type' => 'string', 'description' => 'SSLCommerz Store Password'],
            ['key' => 'sslc_sandbox', 'value' => 'true', 'group' => 'payment', 'type' => 'boolean', 'description' => 'Enable SSLCommerz Sandbox mode'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(['key' => $setting['key']], $setting);
        }
    }
}

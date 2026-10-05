<?php

return [
    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // bKash Sandbox Payment Gateway Configuration
    'bkash' => [
        'base_url' => env('BKASH_BASE_URL', 'https://tokenized.sandbox.bka.sh/v2.0'),
        'app_key' => env('BKASH_APP_KEY', 'sandbox_bkash_app_key_demo'),
        'app_secret' => env('BKASH_APP_SECRET', 'sandbox_bkash_secret_demo_345678'),
        'username' => env('BKASH_USERNAME', 'sandbox_bkash_user'),
        'password' => env('BKASH_PASSWORD', 'sandbox_bkash_password'),
        'callback_url' => env('BKASH_CALLBACK_URL', 'http://localhost:8000/api/payment/bkash/callback'),
    ],

    // SSLCommerz Sandbox Payment Gateway Configuration
    'sslcommerz' => [
        'store_id' => env('SSLC_STORE_ID', 'testbox'),
        'store_password' => env('SSLC_STORE_PASSWORD', 'qwerty'),
        'is_sandbox' => env('SSLC_SANDBOX', true),
        'base_url' => env('SSLC_BASE_URL', 'https://sandbox.sslcommerz.com'),
        'success_url' => env('SSLC_SUCCESS_URL', 'http://localhost:8000/api/payment/sslcommerz/success'),
        'fail_url' => env('SSLC_FAIL_URL', 'http://localhost:8000/api/payment/sslcommerz/fail'),
        'cancel_url' => env('SSLC_CANCEL_URL', 'http://localhost:8000/api/payment/sslcommerz/cancel'),
        'ipn_url' => env('SSLC_IPN_URL', 'http://localhost:8000/api/payment/sslcommerz/ipn'),
    ],

    // CarryBee Courier Logistics Configuration
    'carrybee' => [
        'base_url' => env('CARRYBEE_BASE_URL', 'https://api.carrybee.com/v1'),
        'client_id' => env('CARRYBEE_CLIENT_ID', 'carrybee_sandbox_client_id'),
        'client_secret' => env('CARRYBEE_CLIENT_SECRET', 'carrybee_sandbox_client_secret'),
        'client_context' => env('CARRYBEE_CLIENT_CONTEXT', 'ecommerce_sandbox'),
    ],
];

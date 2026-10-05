<?php

namespace Database\Seeders;

use App\Models\Delivery;
use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds for sample orders, payments, deliveries, and logs.
     */
    public function run(): void
    {
        $customer = User::where('role', 'customer')->first();
        $products = Product::where('status', 'active')->get();

        if ($products->isEmpty()) {
            return;
        }

        // 1. Shipped Order with bKash and CarryBee In Transit
        $p1 = $products->firstWhere('sku', 'AUD-SNY-001') ?? $products[0];
        $p2 = $products->firstWhere('sku', 'PER-LOG-003') ?? ($products[1] ?? $products[0]);

        $subtotal1 = (float) $p1->price + (float) $p2->price;
        $shipping1 = 60.00;
        $total1 = $subtotal1 + $shipping1;

        $order1 = Order::updateOrCreate(
            ['order_number' => 'ORD-20261003-90124'],
            [
                'user_id' => $customer?->id,
                'customer_name' => 'Farhan Ahmed',
                'customer_email' => 'farhan.ahmed@example.com',
                'customer_phone' => '+8801712345678',
                'delivery_address' => 'House 42, Road 11, Block D, Banani, Dhaka 1213',
                'subtotal' => $subtotal1,
                'shipping_cost' => $shipping1,
                'total' => $total1,
                'payment_status' => 'paid',
                'order_status' => 'shipped',
                'created_at' => now()->subHours(20),
                'updated_at' => now()->subHours(10),
            ]
        );

        OrderItem::updateOrCreate(
            ['order_id' => $order1->id, 'product_id' => $p1->id],
            ['quantity' => 1, 'price' => $p1->price, 'subtotal' => $p1->price]
        );
        OrderItem::updateOrCreate(
            ['order_id' => $order1->id, 'product_id' => $p2->id],
            ['quantity' => 1, 'price' => $p2->price, 'subtotal' => $p2->price]
        );

        Payment::updateOrCreate(
            ['transaction_id' => 'BKH98A72F10'],
            [
                'order_id' => $order1->id,
                'gateway' => 'bkash',
                'amount' => $total1,
                'status' => 'completed',
                'response_payload' => [
                    'paymentID' => 'BKASH_PAY_9918239',
                    'trxID' => 'BKH98A72F10',
                    'transactionStatus' => 'Completed',
                    'amount' => (string) $total1,
                    'currency' => 'BDT',
                    'intent' => 'sale',
                    'paymentExecuteTime' => now()->subHours(20)->toISOString(),
                    'customerMsisdn' => '01770618575',
                ],
            ]
        );

        Delivery::updateOrCreate(
            ['order_id' => $order1->id],
            [
                'courier' => 'carrybee',
                'consignment_id' => 'CB-CON-20261003-55102',
                'tracking_number' => 'CB-TRK-78A91F2',
                'status' => 'in_transit',
                'response' => [
                    'consignment_id' => 'CB-CON-20261003-55102',
                    'tracking_number' => 'CB-TRK-78A91F2',
                    'timeline' => [
                        ['status' => 'Order Booked with CarryBee Hub', 'time' => now()->subHours(18)->toDateTimeString()],
                        ['status' => 'Parcel Picked Up by Courier Agent', 'time' => now()->subHours(12)->toDateTimeString()],
                        ['status' => 'In Transit to Banani Sorting Center', 'time' => now()->subHours(4)->toDateTimeString()],
                    ],
                ],
            ]
        );

        InventoryLog::create([
            'product_id' => $p1->id,
            'quantity_change' => -1,
            'type' => 'reservation',
            'reference_id' => $order1->order_number,
            'created_at' => now()->subHours(20),
        ]);
        InventoryLog::create([
            'product_id' => $p2->id,
            'quantity_change' => -1,
            'type' => 'reservation',
            'reference_id' => $order1->order_number,
            'created_at' => now()->subHours(20),
        ]);

        // 2. Completed & Delivered Order with SSLCommerz
        $p3 = $products->firstWhere('sku', 'WCH-APL-002') ?? ($products[2] ?? $products[0]);
        $subtotal2 = (float) $p3->price;
        $shipping2 = 120.00; // Outside Dhaka
        $total2 = $subtotal2 + $shipping2;

        $order2 = Order::updateOrCreate(
            ['order_number' => 'ORD-20261002-88410'],
            [
                'user_id' => null,
                'customer_name' => 'Nadia Rahman',
                'customer_email' => 'nadia.rahman@example.com',
                'customer_phone' => '+8801819876543',
                'delivery_address' => 'Road 4, House 18, Nasirabad Housing Society, Chattogram',
                'subtotal' => $subtotal2,
                'shipping_cost' => $shipping2,
                'total' => $total2,
                'payment_status' => 'paid',
                'order_status' => 'completed',
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDay(),
            ]
        );

        OrderItem::updateOrCreate(
            ['order_id' => $order2->id, 'product_id' => $p3->id],
            ['quantity' => 1, 'price' => $p3->price, 'subtotal' => $p3->price]
        );

        Payment::updateOrCreate(
            ['transaction_id' => 'SSLC_BANK_TRX_99214'],
            [
                'order_id' => $order2->id,
                'gateway' => 'sslcommerz',
                'amount' => $total2,
                'status' => 'completed',
                'response_payload' => [
                    'status' => 'VALID',
                    'tran_id' => $order2->order_number,
                    'val_id' => 'VAL_SSLC_20261002_001',
                    'amount' => (string) $total2,
                    'bank_tran_id' => 'SSLC_BANK_TRX_99214',
                    'card_type' => 'VISA-CityBank',
                    'card_no' => '401200XXXXXX1111',
                    'card_issuer' => 'City Bank PLC',
                    'card_brand' => 'VISA',
                ],
            ]
        );

        Delivery::updateOrCreate(
            ['order_id' => $order2->id],
            [
                'courier' => 'carrybee',
                'consignment_id' => 'CB-CON-20261002-44199',
                'tracking_number' => 'CB-TRK-8819283',
                'status' => 'delivered',
                'response' => [
                    'consignment_id' => 'CB-CON-20261002-44199',
                    'tracking_number' => 'CB-TRK-8819283',
                    'timeline' => [
                        ['status' => 'Parcel Picked Up by CarryBee Hub', 'time' => now()->subDays(2)->toDateTimeString()],
                        ['status' => 'Dispatched to Chattogram Regional Hub', 'time' => now()->subDay()->toDateTimeString()],
                        ['status' => 'Delivered to Nadia Rahman (Signature Verified)', 'time' => now()->subHours(18)->toDateTimeString()],
                    ],
                ],
            ]
        );

        InventoryLog::create([
            'product_id' => $p3->id,
            'quantity_change' => -1,
            'type' => 'purchase',
            'reference_id' => $order2->order_number,
            'created_at' => now()->subDays(2),
        ]);

        // 3. Processing Order Waiting for CarryBee Dispatch
        $p4 = $products->firstWhere('sku', 'BAG-BEL-007') ?? ($products[3] ?? $products[0]);
        $subtotal3 = (float) $p4->price;
        $shipping3 = 60.00;
        $total3 = $subtotal3 + $shipping3;

        $order3 = Order::updateOrCreate(
            ['order_number' => 'ORD-20261004-12948'],
            [
                'user_id' => $customer?->id,
                'customer_name' => 'Tanvir Hassan',
                'customer_email' => 'tanvir.h@example.com',
                'customer_phone' => '+8801912987654',
                'delivery_address' => 'Apartment 5B, Road 18, Sector 7, Uttara, Dhaka',
                'subtotal' => $subtotal3,
                'shipping_cost' => $shipping3,
                'total' => $total3,
                'payment_status' => 'paid',
                'order_status' => 'processing',
                'created_at' => now()->subHours(3),
                'updated_at' => now()->subHours(2),
            ]
        );

        OrderItem::updateOrCreate(
            ['order_id' => $order3->id, 'product_id' => $p4->id],
            ['quantity' => 1, 'price' => $p4->price, 'subtotal' => $p4->price]
        );

        Payment::updateOrCreate(
            ['transaction_id' => 'BKH11C44D99'],
            [
                'order_id' => $order3->id,
                'gateway' => 'bkash',
                'amount' => $total3,
                'status' => 'completed',
                'response_payload' => [
                    'paymentID' => 'BKASH_PAY_1144299',
                    'trxID' => 'BKH11C44D99',
                    'transactionStatus' => 'Completed',
                    'amount' => (string) $total3,
                    'customerMsisdn' => '01912987654',
                ],
            ]
        );

        Delivery::updateOrCreate(
            ['order_id' => $order3->id],
            [
                'courier' => 'carrybee',
                'consignment_id' => 'CB-CON-20261004-99881',
                'tracking_number' => 'CB-TRK-9001882',
                'status' => 'booked',
                'response' => [
                    'consignment_id' => 'CB-CON-20261004-99881',
                    'tracking_number' => 'CB-TRK-9001882',
                    'timeline' => [
                        ['status' => 'Consignment Booked in CarryBee Courier Sandbox', 'time' => now()->subHours(2)->toDateTimeString()],
                    ],
                ],
            ]
        );

        // 4. Pending Order (Awaiting Checkout Payment)
        $p5 = $products->firstWhere('sku', 'AUD-NOT-012') ?? ($products[4] ?? $products[0]);
        $subtotal4 = (float) $p5->price;
        $shipping4 = 60.00;
        $total4 = $subtotal4 + $shipping4;

        $order4 = Order::updateOrCreate(
            ['order_number' => 'ORD-20261004-33819'],
            [
                'user_id' => null,
                'customer_name' => 'Saima Chowdhury',
                'customer_email' => 'saima.c@example.com',
                'customer_phone' => '+8801755667788',
                'delivery_address' => 'House 14, Road 27, Dhanmondi, Dhaka',
                'subtotal' => $subtotal4,
                'shipping_cost' => $shipping4,
                'total' => $total4,
                'payment_status' => 'pending',
                'order_status' => 'pending',
                'created_at' => now()->subMinutes(45),
            ]
        );

        OrderItem::updateOrCreate(
            ['order_id' => $order4->id, 'product_id' => $p5->id],
            ['quantity' => 1, 'price' => $p5->price, 'subtotal' => $p5->price]
        );

        // 5. Cancelled Order with Restored Inventory Log
        $p6 = $products->firstWhere('sku', 'PWR-ANK-006') ?? ($products[5] ?? $products[0]);
        $subtotal5 = (float) $p6->price;
        $shipping5 = 120.00;
        $total5 = $subtotal5 + $shipping5;

        $order5 = Order::updateOrCreate(
            ['order_number' => 'ORD-20261001-44719'],
            [
                'user_id' => null,
                'customer_name' => 'Rafiqul Islam',
                'customer_email' => 'rafiqul.i@example.com',
                'customer_phone' => '+8801611223344',
                'delivery_address' => 'Kashani Villa, Zindabazar, Sylhet',
                'subtotal' => $subtotal5,
                'shipping_cost' => $shipping5,
                'total' => $total5,
                'payment_status' => 'failed',
                'order_status' => 'cancelled',
                'created_at' => now()->subDays(3),
            ]
        );

        OrderItem::updateOrCreate(
            ['order_id' => $order5->id, 'product_id' => $p6->id],
            ['quantity' => 1, 'price' => $p6->price, 'subtotal' => $p6->price]
        );

        InventoryLog::create([
            'product_id' => $p6->id,
            'quantity_change' => 1,
            'type' => 'cancellation',
            'reference_id' => $order5->order_number,
            'created_at' => now()->subDays(3),
        ]);
    }
}

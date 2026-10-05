<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
            [
                'name' => 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
                'sku' => 'AUD-SNY-001',
                'description' => 'Industry-leading noise cancellation with two processors and 8 microphones. Up to 30-hour battery life with quick charging. Ultra-comfortable lightweight design.',
                'price' => 38500.00,
                'stock_quantity' => 15,
                'status' => 'active',
                'image' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Apple Watch Series 9 GPS 45mm Midnight',
                'sku' => 'WCH-APL-002',
                'description' => 'Powerful S9 SiP chip with Double Tap gesture control. Advanced health and fitness tracking, ECG, blood oxygen, and brighter Always-On Retina display.',
                'price' => 49500.00,
                'stock_quantity' => 8,
                'status' => 'active',
                'image' => 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Logitech MX Master 3S Wireless Performance Mouse',
                'sku' => 'PER-LOG-003',
                'description' => 'Quiet clicks with 8K DPI any-surface tracking. MagSpeed electromagnetic scrolling. Ergonomic silhouette crafted for palm comfort.',
                'price' => 12500.00,
                'stock_quantity' => 24,
                'status' => 'active',
                'image' => 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Keychron Q1 Pro Wireless Custom Mechanical Keyboard',
                'sku' => 'KEY-KCR-004',
                'description' => 'Full metal CNC aluminum body 75% layout. QMK/VIA programmable with hot-swappable mechanical switches and double-gasket acoustic design.',
                'price' => 21500.00,
                'stock_quantity' => 4, // low stock test
                'status' => 'active',
                'image' => 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Fujifilm X-T5 Mirrorless Camera Body Black',
                'sku' => 'CAM-FUJ-005',
                'description' => '40.2MP X-Trans CMOS 5 HR sensor with 7 stops of in-body image stabilization (IBIS). Classic dial-based manual exposure operations.',
                'price' => 195000.00,
                'stock_quantity' => 3, // low stock test
                'status' => 'active',
                'image' => 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Anker 737 Power Bank (PowerCore 24K 140W)',
                'sku' => 'PWR-ANK-006',
                'description' => 'Ultra-powerful 140W two-way fast charging with smart digital display. 24,000mAh capacity capable of charging laptops, phones, and tablets.',
                'price' => 14200.00,
                'stock_quantity' => 19,
                'status' => 'active',
                'image' => 'https://images.unsplash.com/photo-1609592426504-89dff5f3fb1a?w=800&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Bellroy Transit Backpack 28L Water-Resistant',
                'sku' => 'BAG-BEL-007',
                'description' => 'Premium everyday carry and travel backpack. Separate quick-access laptop compartment, hidden side water bottle pockets, and recycled Baida ripstop.',
                'price' => 26800.00,
                'stock_quantity' => 12,
                'status' => 'active',
                'image' => 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Bose SoundLink Flex Bluetooth Portable Speaker',
                'sku' => 'SPK-BOS-008',
                'description' => 'Clear, deep audio with PositionIQ technology that optimizes sound in any orientation. IP67 waterproof, dustproof, and floats in water.',
                'price' => 16500.00,
                'stock_quantity' => 16,
                'status' => 'active',
                'image' => 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Peak Design Everyday Sling 6L Ash',
                'sku' => 'BAG-PKD-009',
                'description' => 'Versatile compact sling bag for mirrorless kits, drones, or everyday essentials. Weatherproof 400D nylon canvas shell and FlexFold dividers.',
                'price' => 13500.00,
                'stock_quantity' => 7,
                'status' => 'active',
                'image' => 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Kindle Paperwhite 11th Gen 16GB 6.8" Display',
                'sku' => 'BK-KND-010',
                'description' => '300 ppi glare-free display with adjustable warm light. Up to 10 weeks of battery life and 20% faster page turns. Waterproof for reading anywhere.',
                'price' => 18900.00,
                'stock_quantity' => 11,
                'status' => 'active',
                'image' => 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Marshall Stanmore III Bluetooth Home Speaker',
                'sku' => 'SPK-MSH-011',
                'description' => 'Legendary home audio with an expansive soundstage. Bluetooth 5.2 connectivity and iconic vintage brass accents and fret fretwork.',
                'price' => 44500.00,
                'stock_quantity' => 6,
                'status' => 'active',
                'image' => 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Nothing Ear (2024) Wireless Earbuds',
                'sku' => 'AUD-NOT-012',
                'description' => 'Transparent aesthetic with Hi-Res Audio certification and LDAC. 45 dB Smart Active Noise Cancellation and ceramic diaphragm driver.',
                'price' => 17500.00,
                'stock_quantity' => 20,
                'status' => 'active',
                'image' => 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
            ],
        ];

        foreach ($products as $pData) {
            Product::updateOrCreate(
                ['sku' => $pData['sku']],
                array_merge($pData, [
                    'slug' => Str::slug($pData['name']),
                ])
            );
        }
    }
}

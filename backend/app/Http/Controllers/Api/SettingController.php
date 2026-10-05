<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SettingRequest;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Admin view settings: GET /api/admin/settings
     */
    public function index(): JsonResponse
    {
        $settings = Setting::all()->groupBy('group');

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    /**
     * Admin update settings: POST /api/admin/settings
     */
    public function update(SettingRequest $request): JsonResponse
    {
        $settingsList = $request->input('settings', []);

        foreach ($settingsList as $item) {
            Setting::set(
                $item['key'],
                $item['value'] ?? '',
                $item['group'] ?? 'general',
                $item['type'] ?? 'string'
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings saved successfully.',
        ]);
    }

    /**
     * Public application configuration: GET /api/settings/public
     */
    public function publicSettings(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'store_name' => Setting::get('store_name', 'ShopLagbe'),
            'currency' => 'BDT',
            'currency_symbol' => '৳',
            'shipping_inside_dhaka' => (float) Setting::get('shipping_inside_dhaka', 60.00),
            'shipping_outside_dhaka' => (float) Setting::get('shipping_outside_dhaka', 120.00),
            'default_shipping_cost' => (float) Setting::get('default_shipping_cost', 60.00),
            'active_gateways' => ['bkash', 'sslcommerz', 'cod'],
        ]);
    }

    /**
     * Admin dashboard summary widgets: GET /api/admin/dashboard/stats
     */
    public function dashboardStats(): JsonResponse
    {
        $totalRevenue = Order::where('payment_status', 'paid')->sum('total');
        $totalOrders = Order::count();
        $pendingOrders = Order::where('order_status', 'pending')->count();
        $totalProducts = Product::count();
        $lowStockCount = Product::lowStock(5)->where('status', 'active')->count();

        $deliveriesByStatus = Delivery::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $recentOrders = Order::with(['items.product', 'latestPayment'])
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'stats' => [
                'total_revenue' => (float) $totalRevenue,
                'total_orders' => $totalOrders,
                'pending_orders' => $pendingOrders,
                'total_products' => $totalProducts,
                'low_stock_alerts' => $lowStockCount,
                'deliveries' => $deliveriesByStatus,
            ],
            'recent_orders' => \App\Http\Resources\OrderResource::collection($recentOrders),
        ]);
    }
}

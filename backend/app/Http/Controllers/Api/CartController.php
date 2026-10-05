<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    /**
     * Validate cart items, recalculate exact subtotals and check stock: POST /api/cart/validate
     */
    public function validateCart(Request $request): JsonResponse
    {
        $request->validate([
            'items' => ['required', 'array'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        $items = $request->input('items', []);
        $validatedItems = [];
        $subtotal = 0;
        $hasErrors = false;

        foreach ($items as $item) {
            $product = Product::find($item['product_id']);

            if (!$product || $product->status !== 'active') {
                $validatedItems[] = [
                    'product_id' => $item['product_id'],
                    'available' => false,
                    'error' => 'Product is no longer available.',
                ];
                $hasErrors = true;
                continue;
            }

            $availableStock = $product->stock_quantity;
            $requestedQty = (int) $item['quantity'];
            $isQuantityAvailable = $availableStock >= $requestedQty;

            if (!$isQuantityAvailable) {
                $hasErrors = true;
            }

            $lineSubtotal = bcmul((string) $product->price, (string) $requestedQty, 2);
            $subtotal = bcadd((string) $subtotal, (string) $lineSubtotal, 2);

            $validatedItems[] = [
                'product_id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'sku' => $product->sku,
                'image' => $product->image,
                'price' => (float) $product->price,
                'requested_quantity' => $requestedQty,
                'available_stock' => $availableStock,
                'line_subtotal' => (float) $lineSubtotal,
                'is_available' => $isQuantityAvailable,
                'error' => $isQuantityAvailable ? null : "Only {$availableStock} items in stock.",
            ];
        }

        $shippingCost = (float) Setting::get('default_shipping_cost', 60.00);
        $total = bcadd((string) $subtotal, (string) $shippingCost, 2);

        return response()->json([
            'success' => !$hasErrors,
            'has_errors' => $hasErrors,
            'subtotal' => (float) $subtotal,
            'shipping_cost' => $shippingCost,
            'total' => (float) $total,
            'items' => $validatedItems,
        ]);
    }
}

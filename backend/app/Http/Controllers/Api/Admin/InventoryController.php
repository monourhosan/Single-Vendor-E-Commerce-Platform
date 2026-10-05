<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\InventoryAdjustmentRequest;
use App\Http\Resources\ProductResource;
use App\Services\InventoryService;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class InventoryController extends Controller
{
    protected InventoryService $inventoryService;
    protected ProductService $productService;

    public function __construct(InventoryService $inventoryService, ProductService $productService)
    {
        $this->inventoryService = $inventoryService;
        $this->productService = $productService;
    }

    /**
     * Add inventory stock to a product.
     * POST /api/admin/products/{id}/inventory/add
     */
    public function addInventory($id, InventoryAdjustmentRequest $request): JsonResponse
    {
        $product = $this->productService->findProduct($id);
        $quantity = (int) $request->input('quantity');
        $reason = $request->input('reason', 'Supplier shipment / restock');
        $userId = $request->user()?->id;

        try {
            $updatedProduct = $this->inventoryService->addStock(
                $product->id,
                $quantity,
                $reason,
                $userId
            );

            return response()->json([
                'success' => true,
                'message' => "Successfully added {$quantity} units to stock.",
                'data' => new ProductResource($updatedProduct),
            ]);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Remove inventory stock from a product.
     * POST /api/admin/products/{id}/inventory/remove
     */
    public function removeInventory($id, InventoryAdjustmentRequest $request): JsonResponse
    {
        $product = $this->productService->findProduct($id);
        $quantity = (int) $request->input('quantity');
        $reason = $request->input('reason', 'Damaged product / manual deduction');
        $userId = $request->user()?->id;

        try {
            $updatedProduct = $this->inventoryService->removeStock(
                $product->id,
                $quantity,
                $reason,
                $userId
            );

            return response()->json([
                'success' => true,
                'message' => "Successfully removed {$quantity} units from stock.",
                'data' => new ProductResource($updatedProduct),
            ]);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Retrieve audit history of inventory adjustments for a product.
     * GET /api/admin/products/{id}/inventory/history
     */
    public function history($id, Request $request): JsonResponse
    {
        $product = $this->productService->findProduct($id);
        $perPage = min((int) $request->input('per_page', 15), 100);

        $logs = $this->inventoryService->getLogs($product->id, $perPage);

        return response()->json([
            'success' => true,
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'stock_quantity' => $product->stock_quantity,
            ],
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }
}

<?php

namespace App\Services;

use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Exception;
use InvalidArgumentException;

class InventoryService
{
    /**
     * Add inventory stock with row locking (SELECT FOR UPDATE) and transaction safety.
     *
     * @param int|Product $product
     * @param int $quantity
     * @param string $reason
     * @param int|null $userId Admin ID
     * @return Product
     * @throws InvalidArgumentException
     */
    public function addStock(int|Product $product, int $quantity, string $reason, ?int $userId = null, string $type = 'restock'): Product
    {
        if ($quantity <= 0) {
            throw new InvalidArgumentException('Stock increase quantity must be greater than zero.');
        }

        return DB::transaction(function () use ($product, $quantity, $reason, $userId, $type) {
            $productId = $product instanceof Product ? $product->id : $product;
            $lockedProduct = Product::where('id', $productId)->lockForUpdate()->firstOrFail();

            $previousQty = (int) $lockedProduct->stock_quantity;
            $newQty = $previousQty + $quantity;

            $lockedProduct->stock_quantity = $newQty;
            $lockedProduct->save();

            InventoryLog::create([
                'product_id' => $lockedProduct->id,
                'quantity_change' => $quantity,
                'previous_quantity' => $previousQty,
                'new_quantity' => $newQty,
                'type' => $type,
                'reason' => $reason,
                'user_id' => $userId,
                'reference_id' => 'ADMIN-ADD-' . now()->timestamp,
            ]);

            return $lockedProduct->fresh();
        });
    }

    /**
     * Remove inventory stock with row locking (SELECT FOR UPDATE) and negative stock prevention.
     *
     * @param int|Product $product
     * @param int $quantity
     * @param string $reason
     * @param int|null $userId Admin ID
     * @return Product
     * @throws InvalidArgumentException
     */
    public function removeStock(int|Product $product, int $quantity, string $reason, ?int $userId = null): Product
    {
        if ($quantity <= 0) {
            throw new InvalidArgumentException('Stock reduction quantity must be greater than zero.');
        }

        return DB::transaction(function () use ($product, $quantity, $reason, $userId) {
            $productId = $product instanceof Product ? $product->id : $product;
            $lockedProduct = Product::where('id', $productId)->lockForUpdate()->firstOrFail();

            $previousQty = (int) $lockedProduct->stock_quantity;

            if ($previousQty < $quantity) {
                throw new InvalidArgumentException("Insufficient stock to deduct {$quantity}. Current stock is {$previousQty}. Stock quantity cannot be negative.");
            }

            $newQty = $previousQty - $quantity;
            $lockedProduct->stock_quantity = $newQty;
            $lockedProduct->save();

            InventoryLog::create([
                'product_id' => $lockedProduct->id,
                'quantity_change' => -$quantity,
                'previous_quantity' => $previousQty,
                'new_quantity' => $newQty,
                'type' => 'manual_deduction',
                'reason' => $reason,
                'user_id' => $userId,
                'reference_id' => 'ADMIN-REMOVE-' . now()->timestamp,
            ]);

            return $lockedProduct->fresh();
        });
    }

    /**
     * Adjust stock directly by action ('ADD' or 'REMOVE').
     */
    public function adjustStock(int|Product $product, string $action, int $quantity, string $reason, ?int $userId = null): Product
    {
        if (strtoupper($action) === 'REMOVE') {
            return $this->removeStock($product, $quantity, $reason, $userId);
        }

        return $this->addStock($product, $quantity, $reason, $userId);
    }

    /**
     * Reserve and deduct product stock with database row locking (SELECT FOR UPDATE).
     */
    public function reserveStock(array $items, string $referenceId): void
    {
        // Items ordered by product_id to prevent database deadlocks across concurrent requests
        usort($items, fn($a, $b) => $a['product_id'] <=> $b['product_id']);

        foreach ($items as $item) {
            $productId = $item['product_id'];
            $requestedQty = (int) $item['quantity'];

            if ($requestedQty <= 0) {
                throw new Exception("Invalid order quantity for product ID {$productId}.");
            }

            $product = Product::where('id', $productId)->lockForUpdate()->first();

            if (!$product) {
                throw new Exception("Product with ID {$productId} not found.");
            }

            if ($product->stock_quantity < $requestedQty) {
                throw new Exception("Insufficient stock for product '{$product->name}'. Available: {$product->stock_quantity}, requested: {$requestedQty}.");
            }

            $previousQty = (int) $product->stock_quantity;
            $newQty = $previousQty - $requestedQty;

            $product->stock_quantity = $newQty;
            $product->save();

            InventoryLog::create([
                'product_id' => $product->id,
                'quantity_change' => -$requestedQty,
                'previous_quantity' => $previousQty,
                'new_quantity' => $newQty,
                'type' => 'reservation',
                'reason' => 'Order item reservation for order ' . $referenceId,
                'reference_id' => $referenceId,
            ]);
        }
    }

    /**
     * Restore stock for an order whose payment failed or was cancelled.
     */
    public function restoreStock(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $items = $order->items()->orderBy('product_id')->get();

            foreach ($items as $item) {
                $product = Product::where('id', $item->product_id)->lockForUpdate()->first();

                if ($product) {
                    $previousQty = (int) $product->stock_quantity;
                    $newQty = $previousQty + $item->quantity;

                    $product->stock_quantity = $newQty;
                    $product->save();

                    InventoryLog::create([
                        'product_id' => $product->id,
                        'quantity_change' => $item->quantity,
                        'previous_quantity' => $previousQty,
                        'new_quantity' => $newQty,
                        'type' => 'cancellation',
                        'reason' => 'Restored stock from order cancellation: ' . $order->order_number,
                        'reference_id' => $order->order_number,
                    ]);
                }
            }
        });
    }

    /**
     * Backward-compatible restock alias.
     */
    public function restock(int $productId, int $quantity, string $reason = 'restock', ?int $userId = null): Product
    {
        return $this->addStock($productId, $quantity, $reason, $userId, $reason);
    }

    /**
     * Get paginated audit logs for a product with admin details.
     */
    public function getLogs(int $productId, int $perPage = 15): LengthAwarePaginator
    {
        return InventoryLog::with('user')
            ->where('product_id', $productId)
            ->latest()
            ->paginate($perPage);
    }
}

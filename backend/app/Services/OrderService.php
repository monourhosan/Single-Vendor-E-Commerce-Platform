<?php

namespace App\Services;

use App\Events\OrderCreated;
use App\Events\PaymentCompleted;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Exception;

class OrderService
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Create an order with concurrency-safe inventory deduction in a single DB transaction.
     *
     * @param array $data Customer and shipping details
     * @param array $items Array of ['product_id' => int, 'quantity' => int]
     * @param int|null $userId
     * @return Order
     * @throws Exception
     */
    public function createOrder(array $data, array $items, ?int $userId = null): Order
    {
        if (empty($items)) {
            throw new Exception("Cannot create an empty order.");
        }

        return DB::transaction(function () use ($data, $items, $userId) {
            $orderNumber = 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            // 1. Reserve stock with row locking (SELECT FOR UPDATE)
            $this->inventoryService->reserveStock($items, $orderNumber);

            // 2. Fetch prices from locked/fresh products and calculate subtotals
            $subtotal = 0;
            $preparedItems = [];

            foreach ($items as $item) {
                $product = Product::findOrFail($item['product_id']);
                $quantity = (int) $item['quantity'];
                $itemSubtotal = bcmul((string) $product->price, (string) $quantity, 2);
                $subtotal = bcadd((string) $subtotal, (string) $itemSubtotal, 2);

                $preparedItems[] = [
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'price' => $product->price,
                    'subtotal' => $itemSubtotal,
                ];
            }

            // 3. Determine shipping cost
            $shippingCost = (float) Setting::get('default_shipping_cost', config('services.shipping.default', 60.00));
            if (isset($data['shipping_cost'])) {
                $shippingCost = (float) $data['shipping_cost'];
            }

            $total = bcadd((string) $subtotal, (string) $shippingCost, 2);

            // 4. Create Order
            $order = Order::create([
                'user_id' => $userId,
                'order_number' => $orderNumber,
                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'],
                'customer_phone' => $data['customer_phone'],
                'delivery_address' => $data['delivery_address'],
                'subtotal' => $subtotal,
                'shipping_cost' => $shippingCost,
                'total' => $total,
                'payment_status' => 'pending',
                'order_status' => 'pending',
            ]);

            // 5. Create Order Items
            foreach ($preparedItems as $pItem) {
                $order->items()->create($pItem);
            }

            // 6. Fire OrderCreated Event
            event(new OrderCreated($order));

            return $order->load('items.product');
        });
    }

    /**
     * Mark order as paid, updating status and triggering event.
     */
    public function markAsPaid(Order $order, string $gateway, string $transactionId, array $rawPayload = []): Order
    {
        return DB::transaction(function () use ($order, $gateway, $transactionId, $rawPayload) {
            $order->payment_status = 'paid';
            $order->order_status = 'processing';
            $order->save();

            $order->payments()->updateOrCreate(
                ['transaction_id' => $transactionId],
                [
                    'gateway' => $gateway,
                    'amount' => $order->total,
                    'status' => 'completed',
                    'response_payload' => $rawPayload,
                ]
            );

            // Trigger PaymentCompleted event which invokes listeners
            event(new PaymentCompleted($order, $transactionId, $rawPayload));

            return $order;
        });
    }

    /**
     * Handle payment failure or user cancellation by releasing reserved stock.
     */
    public function markAsFailed(Order $order, string $reason = 'Payment failed'): Order
    {
        return DB::transaction(function () use ($order, $reason) {
            if ($order->payment_status !== 'paid') {
                $order->payment_status = 'failed';
                $order->order_status = 'cancelled';
                $order->save();

                // Release inventory
                $this->inventoryService->restoreStock($order);
            }

            return $order;
        });
    }

    /**
     * Update order status with inventory release handling if cancelled.
     */
    public function updateOrderStatus(Order $order, string $orderStatus, ?string $paymentStatus = null): Order
    {
        return DB::transaction(function () use ($order, $orderStatus, $paymentStatus) {
            if ($orderStatus === 'cancelled' && $order->order_status !== 'cancelled') {
                $this->markAsFailed($order, 'Cancelled by administrator');
            } else {
                $order->order_status = $orderStatus;
                if ($paymentStatus !== null) {
                    $order->payment_status = $paymentStatus;
                }
                $order->save();
            }

            return $order->fresh(['items.product', 'delivery', 'latestPayment']);
        });
    }

    /**
     * Get paginated admin orders with filters.
     */
    public function getAdminOrders(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Order::with(['items.product', 'latestPayment', 'delivery']);

        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }

        if (!empty($filters['order_status'])) {
            $query->where('order_status', $filters['order_status']);
        }

        if (!empty($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }

        $perPage = min(max($perPage, 1), 100);

        return $query->latest()->paginate($perPage);
    }

    /**
     * Get customer orders history.
     */
    public function getCustomerOrders(int $userId, int $perPage = 10): LengthAwarePaginator
    {
        return Order::with(['items.product', 'latestPayment', 'delivery'])
            ->where('user_id', $userId)
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Find order by ID or order_number.
     */
    public function findOrder(string|int $id): Order
    {
        return Order::with(['items.product', 'payments', 'delivery'])
            ->where('id', $id)
            ->orWhere('order_number', (string) $id)
            ->firstOrFail();
    }
}

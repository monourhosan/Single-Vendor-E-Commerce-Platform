<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\OrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\Delivery\CarryBeeService;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    protected OrderService $orderService;
    protected CarryBeeService $carryBeeService;

    public function __construct(OrderService $orderService, CarryBeeService $carryBeeService)
    {
        $this->orderService = $orderService;
        $this->carryBeeService = $carryBeeService;
    }

    /**
     * Admin order listing: GET /api/admin/orders
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 15), 100);
        $orders = $this->orderService->getAdminOrders(
            $request->only(['search', 'order_status', 'payment_status']),
            $perPage
        );

        return response()->json([
            'success' => true,
            'data' => OrderResource::collection($orders->items()),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    /**
     * Order details: GET /api/orders/{id}
     */
    public function show($id): JsonResponse
    {
        $order = $this->orderService->findOrder($id);

        return response()->json([
            'success' => true,
            'data' => new OrderResource($order),
        ]);
    }

    /**
     * Admin update order status: PUT /api/admin/orders/{id}/status
     */
    public function updateStatus(OrderRequest $request, $id): JsonResponse
    {
        $order = $this->orderService->findOrder($id);
        $updatedOrder = $this->orderService->updateOrderStatus(
            $order,
            $request->input('order_status'),
            $request->input('payment_status')
        );

        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully.',
            'data' => new OrderResource($updatedOrder),
        ]);
    }

    /**
     * Customer order history: GET /api/customer/orders
     */
    public function customerOrders(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $orders = $this->orderService->getCustomerOrders($userId, 10);

        return response()->json([
            'success' => true,
            'data' => OrderResource::collection($orders->items()),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    /**
     * Public order tracking: GET /api/orders/track/{orderNumber}
     */
    public function trackOrder($orderNumber): JsonResponse
    {
        $order = Order::with(['items.product', 'delivery'])
            ->where('order_number', $orderNumber)
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found. Please verify the order number.',
            ], 404);
        }

        $trackingInfo = null;
        if ($order->delivery && $order->delivery->tracking_number) {
            $trackingInfo = $this->carryBeeService->trackDelivery($order->delivery->tracking_number);
        }

        return response()->json([
            'success' => true,
            'order' => new OrderResource($order),
            'tracking' => $trackingInfo,
        ]);
    }
}

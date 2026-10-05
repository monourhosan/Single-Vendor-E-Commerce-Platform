<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DeliveryRequest;
use App\Http\Resources\DeliveryResource;
use App\Models\Delivery;
use App\Models\Order;
use App\Services\Delivery\CarryBeeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class DeliveryController extends Controller
{
    protected CarryBeeService $carryBeeService;

    public function __construct(CarryBeeService $carryBeeService)
    {
        $this->carryBeeService = $carryBeeService;
    }

    /**
     * Admin deliveries list: GET /api/admin/deliveries
     */
    public function index(DeliveryRequest $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 15), 100);
        $deliveries = $this->carryBeeService->getAdminDeliveries(
            $request->only(['status', 'search']),
            $perPage
        );

        return response()->json([
            'success' => true,
            'data' => DeliveryResource::collection($deliveries->items()),
            'meta' => [
                'current_page' => $deliveries->currentPage(),
                'last_page' => $deliveries->lastPage(),
                'per_page' => $deliveries->perPage(),
                'total' => $deliveries->total(),
            ],
        ]);
    }

    /**
     * Admin trigger CarryBee delivery booking for an order: POST /api/admin/deliveries/book/{orderId}
     */
    public function triggerDelivery($orderId): JsonResponse
    {
        $order = Order::findOrFail($orderId);

        try {
            $delivery = $this->carryBeeService->createDelivery($order);

            return response()->json([
                'success' => true,
                'message' => 'CarryBee consignment booked successfully.',
                'data' => new DeliveryResource($delivery),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to book CarryBee delivery: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Query live CarryBee tracking timeline: GET /api/deliveries/track/{trackingNumber}
     */
    public function track($trackingNumber): JsonResponse
    {
        $delivery = Delivery::where('tracking_number', $trackingNumber)
            ->orWhere('consignment_id', $trackingNumber)
            ->first();

        $trackingData = $this->carryBeeService->trackDelivery($trackingNumber);

        return response()->json([
            'success' => true,
            'delivery' => $delivery ? new DeliveryResource($delivery) : null,
            'tracking' => $trackingData,
        ]);
    }

    /**
     * CarryBee consignment status update webhook: POST /api/deliveries/webhook/carrybee
     */
    public function carrybeeWebhook(Request $request): JsonResponse
    {
        try {
            $delivery = $this->carryBeeService->processWebhook($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Delivery status updated successfully.',
                'data' => new DeliveryResource($delivery),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 404);
        }
    }
}

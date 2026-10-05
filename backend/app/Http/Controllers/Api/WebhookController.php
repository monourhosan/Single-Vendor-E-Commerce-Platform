<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DeliveryResource;
use App\Services\Delivery\CarryBeeService;
use App\Services\Payment\BkashService;
use App\Services\Payment\SSLCommerzService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class WebhookController extends Controller
{
    protected CarryBeeService $carryBeeService;
    protected BkashService $bkashService;
    protected SSLCommerzService $sslCommerzService;

    public function __construct(
        CarryBeeService $carryBeeService,
        BkashService $bkashService,
        SSLCommerzService $sslCommerzService
    ) {
        $this->carryBeeService = $carryBeeService;
        $this->bkashService = $bkashService;
        $this->sslCommerzService = $sslCommerzService;
    }

    /**
     * CarryBee consignment status update webhook: POST /api/deliveries/webhook/carrybee
     */
    public function carrybee(Request $request): JsonResponse
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

    /**
     * bKash asynchronous webhook notification: POST /api/payment/bkash/webhook
     */
    public function bkash(Request $request): JsonResponse
    {
        $result = $this->bkashService->handleWebhook($request->all());

        return response()->json($result);
    }

    /**
     * SSLCommerz IPN (Instant Payment Notification): POST /api/payment/sslcommerz/ipn
     */
    public function sslcommerzIpn(Request $request): JsonResponse
    {
        $result = $this->sslCommerzService->handleWebhook($request->all());

        return response()->json($result);
    }
}

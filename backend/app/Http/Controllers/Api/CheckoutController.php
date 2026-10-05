<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Http\Resources\OrderResource;
use App\Jobs\CreateCarryBeeDeliveryJob;
use App\Models\Payment;
use App\Services\Delivery\CarryBeeService;
use App\Services\OrderService;
use App\Services\Payment\BkashService;
use App\Services\Payment\SSLCommerzService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Exception;

class CheckoutController extends Controller
{
    protected OrderService $orderService;
    protected BkashService $bkashService;
    protected SSLCommerzService $sslCommerzService;
    protected CarryBeeService $carryBeeService;

    public function __construct(
        OrderService $orderService,
        BkashService $bkashService,
        SSLCommerzService $sslCommerzService,
        CarryBeeService $carryBeeService
    ) {
        $this->orderService = $orderService;
        $this->bkashService = $bkashService;
        $this->sslCommerzService = $sslCommerzService;
        $this->carryBeeService = $carryBeeService;
    }

    /**
     * Process customer checkout: POST /api/checkout
     */
    public function checkout(CheckoutRequest $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $gateway = $request->input('payment_gateway');

        try {
            // 1. Transactionally create order & lock inventory
            $order = $this->orderService->createOrder(
                $request->only([
                    'customer_name',
                    'customer_email',
                    'customer_phone',
                    'delivery_address',
                    'shipping_cost',
                ]),
                $request->input('items'),
                $userId
            );

            // 2. Gateway-specific processing
            if ($request->boolean('defer_payment')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Order created. Proceeding to payment gateway.',
                    'order' => new OrderResource($order),
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                ]);
            }

            if ($gateway === 'bkash') {
                $paymentSession = $this->bkashService->createPayment($order);

                return response()->json([
                    'success' => true,
                    'message' => 'Order created. Redirecting to bKash gateway.',
                    'order' => new OrderResource($order),
                    'payment_id' => $paymentSession['payment_id'] ?? null,
                    'redirect_url' => $paymentSession['redirect_url'] ?? null,
                ]);
            }

            if ($gateway === 'sslcommerz') {
                $paymentSession = $this->sslCommerzService->createPayment($order);

                return response()->json([
                    'success' => true,
                    'message' => 'Order created. Redirecting to SSLCommerz gateway.',
                    'order' => new OrderResource($order),
                    'payment_id' => $paymentSession['payment_id'] ?? null,
                    'redirect_url' => $paymentSession['redirect_url'] ?? null,
                ]);
            }

            // 3. Cash on Delivery (COD)
            if ($gateway === 'cod') {
                Payment::create([
                    'order_id' => $order->id,
                    'gateway' => 'cod',
                    'transaction_id' => 'COD-' . $order->order_number,
                    'amount' => $order->total,
                    'status' => 'initiated',
                    'response_payload' => ['payment_type' => 'Cash on Delivery'],
                ]);

                // Create CarryBee Delivery with cash collection
                CreateCarryBeeDeliveryJob::dispatch($order);

                $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
                $successUrl = "{$frontendUrl}/payment/success?order={$order->order_number}&gateway=cod";

                return response()->json([
                    'success' => true,
                    'message' => 'Order confirmed with Cash on Delivery.',
                    'order' => new OrderResource($order),
                    'redirect_url' => $successUrl,
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Unsupported payment gateway.',
            ], 400);

        } catch (Exception $e) {
            Log::error('Checkout processing error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}

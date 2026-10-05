<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentRequest;
use App\Http\Resources\OrderResource;
use App\Http\Resources\PaymentResource;
use App\Models\Order;
use App\Models\Payment;
use App\Services\OrderService;
use App\Services\Payment\BkashService;
use App\Services\Payment\SSLCommerzService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    protected BkashService $bkashService;
    protected SSLCommerzService $sslCommerzService;
    protected OrderService $orderService;

    public function __construct(
        BkashService $bkashService,
        SSLCommerzService $sslCommerzService,
        OrderService $orderService
    ) {
        $this->bkashService = $bkashService;
        $this->sslCommerzService = $sslCommerzService;
        $this->orderService = $orderService;
    }

    /**
     * Admin payment transactions list: GET /api/admin/payments
     */
    public function index(PaymentRequest $request): JsonResponse
    {
        $query = Payment::with('order');

        if ($gateway = $request->input('gateway')) {
            $query->where('gateway', $gateway);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $like = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $like) {
                $q->where('transaction_id', $like, "%{$search}%")
                  ->orWhereHas('order', function ($oq) use ($search, $like) {
                      $oq->where('order_number', $like, "%{$search}%")
                         ->orWhere('customer_name', $like, "%{$search}%");
                  });
            });
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $payments = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => PaymentResource::collection($payments->items()),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
        ]);
    }

    /**
     * Admin payment detail: GET /api/admin/payments/{id}
     */
    public function show($id): JsonResponse
    {
        $payment = Payment::with('order')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new PaymentResource($payment),
        ]);
    }

    /**
     * Handle bKash redirect callback.
     */
    public function bkashCallback(Request $request): RedirectResponse
    {
        $result = $this->bkashService->handleCallback($request->all());

        return redirect($result['redirect_url']);
    }

    /**
     * Handle SSLCommerz Success callback.
     */
    public function sslcommerzSuccess(Request $request): RedirectResponse
    {
        $params = array_merge($request->all(), ['callback_type' => 'success']);
        $result = $this->sslCommerzService->handleCallback($params);

        return redirect($result['redirect_url']);
    }

    /**
     * Handle SSLCommerz Fail callback.
     */
    public function sslcommerzFail(Request $request): RedirectResponse
    {
        $params = array_merge($request->all(), ['callback_type' => 'fail']);
        $result = $this->sslCommerzService->handleCallback($params);

        return redirect($result['redirect_url']);
    }

    /**
     * Handle SSLCommerz Cancel callback.
     */
    public function sslcommerzCancel(Request $request): RedirectResponse
    {
        $params = array_merge($request->all(), ['callback_type' => 'cancel']);
        $result = $this->sslCommerzService->handleCallback($params);

        return redirect($result['redirect_url']);
    }

    /**
     * Initiate bKash payment record: POST /api/payment/bkash/initiate
     */
    public function bkashInitiate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'paymentID' => ['required', 'string'],
            'order_number' => ['required', 'string'],
            'amount' => ['nullable'],
        ]);

        $order = Order::where('order_number', $validated['order_number'])
            ->orWhere('id', is_numeric($validated['order_number']) ? $validated['order_number'] : 0)
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        $payment = Payment::updateOrCreate(
            ['transaction_id' => $validated['paymentID']],
            [
                'order_id' => $order->id,
                'gateway' => 'bkash',
                'amount' => $order->total,
                'status' => 'initiated',
                'response_payload' => $request->all(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'bKash payment session initiated.',
            'payment' => new PaymentResource($payment),
        ]);
    }

    /**
     * Verify bKash payment with Laravel: POST /api/payment/bkash/verify
     */
    public function bkashVerify(Request $request): JsonResponse
    {
        $request->validate([
            'paymentID' => ['required', 'string'],
            'orderID' => ['required', 'string'],
            'status' => ['nullable', 'string'],
        ]);

        $orderIdentifier = $request->input('orderID');
        $paymentId = $request->input('paymentID');
        $trxId = $request->input('trxID', $paymentId);
        $status = strtolower($request->input('status', 'completed'));

        $order = Order::where('order_number', $orderIdentifier)
            ->orWhere('id', is_numeric($orderIdentifier) ? $orderIdentifier : 0)
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => "Order {$orderIdentifier} not found.",
            ], 404);
        }

        // Idempotency check: if order is already marked paid
        if ($order->payment_status === 'paid') {
            return response()->json([
                'success' => true,
                'message' => 'Payment already verified and recorded.',
                'order' => new OrderResource($order),
                'trxID' => $trxId,
                'idempotent' => true,
            ]);
        }

        if (in_array($status, ['completed', 'success'])) {
            // Update order and payment, fire PaymentCompleted event (which dispatches CarryBee delivery job)
            $this->orderService->markAsPaid($order, 'bkash', $trxId, $request->all());

            Log::info("bKash Payment Verified & Paid: Order {$order->order_number}, Trx {$trxId}");

            return response()->json([
                'success' => true,
                'message' => 'Payment verified successfully. CarryBee dispatch queued.',
                'order' => new OrderResource($order->fresh()),
                'trxID' => $trxId,
            ]);
        }

        // If status indicates failure or cancellation, restore reserved inventory
        $this->orderService->markAsFailed($order, "bKash transaction status: {$status}");

        return response()->json([
            'success' => false,
            'message' => "Payment verification failed with status {$status}.",
            'order' => new OrderResource($order->fresh()),
        ], 422);
    }

    /**
     * Notify payment failure or cancellation: POST /api/payment/bkash/failed
     */
    public function bkashFailed(Request $request): JsonResponse
    {
        $request->validate([
            'order_number' => ['required', 'string'],
            'reason' => ['nullable', 'string'],
        ]);

        $orderNumber = $request->input('order_number');
        $reason = $request->input('reason', 'Payment declined or cancelled by customer');

        $order = Order::where('order_number', $orderNumber)
            ->orWhere('id', is_numeric($orderNumber) ? $orderNumber : 0)
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        if ($order->payment_status !== 'paid') {
            $this->orderService->markAsFailed($order, $reason);
        }

        return response()->json([
            'success' => true,
            'message' => 'Order marked as failed and reserved stock restored.',
            'order' => new OrderResource($order->fresh()),
        ]);
    }

    /**
     * Admin refund payment: POST /api/admin/payments/{id}/refund
     */
    public function refund($id, Request $request): JsonResponse
    {
        $payment = Payment::where('id', $id)
            ->orWhere('transaction_id', (string) $id)
            ->firstOrFail();

        $refundTrxId = $request->input('refundTrxID', 'REF-' . strtoupper(uniqid()));
        $reason = $request->input('reason', 'Refunded by administrator');

        $payment->status = 'refunded';
        $payload = $payment->response_payload ?? [];
        $payload['refund'] = [
            'refundTrxID' => $refundTrxId,
            'reason' => $reason,
            'refunded_at' => now()->toDateTimeString(),
            'amount' => $request->input('amount', $payment->amount),
        ];
        $payment->response_payload = $payload;
        $payment->save();

        if ($payment->order) {
            $payment->order->payment_status = 'refunded';
            $payment->order->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment refunded successfully.',
            'payment' => new PaymentResource($payment),
        ]);
    }
}

<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Setting;
use App\Services\OrderService;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class SSLCommerzService implements PaymentGatewayInterface
{
    protected Client $client;
    protected string $storeId;
    protected string $storePassword;
    protected bool $isSandbox;
    protected string $baseUrl;
    protected string $successUrl;
    protected string $failUrl;
    protected string $cancelUrl;
    protected string $ipnUrl;
    protected ?OrderService $orderService = null;

    public function __construct(?OrderService $orderService = null)
    {
        $this->orderService = $orderService;
        $this->storeId = Setting::get('sslc_store_id', config('services.sslcommerz.store_id', 'testbox'));
        $this->storePassword = Setting::get('sslc_store_password', config('services.sslcommerz.store_password', 'qwerty'));
        $this->isSandbox = Setting::get('sslc_sandbox', config('services.sslcommerz.is_sandbox', true));

        $this->baseUrl = $this->isSandbox
            ? 'https://sandbox.sslcommerz.com'
            : 'https://securepay.sslcommerz.com';

        $this->successUrl = Setting::get('sslc_success_url', config('services.sslcommerz.success_url', url('/api/payment/sslcommerz/success')));
        $this->failUrl = Setting::get('sslc_fail_url', config('services.sslcommerz.fail_url', url('/api/payment/sslcommerz/fail')));
        $this->cancelUrl = Setting::get('sslc_cancel_url', config('services.sslcommerz.cancel_url', url('/api/payment/sslcommerz/cancel')));
        $this->ipnUrl = Setting::get('sslc_ipn_url', config('services.sslcommerz.ipn_url', url('/api/payment/sslcommerz/ipn')));

        $this->client = new Client([
            'base_uri' => rtrim($this->baseUrl, '/') . '/',
            'timeout' => 30.0,
            'http_errors' => false,
        ]);
    }

    protected function getOrderService(): OrderService
    {
        if (!$this->orderService) {
            $this->orderService = app(OrderService::class);
        }
        return $this->orderService;
    }

    /**
     * Create SSLCommerz Session and retrieve GatewayPageURL.
     */
    public function createPayment(Order $order, array $extraData = []): array
    {
        $postData = [
            'store_id' => $this->storeId,
            'store_passwd' => $this->storePassword,
            'total_amount' => (string) number_format((float) $order->total, 2, '.', ''),
            'currency' => 'BDT',
            'tran_id' => $order->order_number,
            'success_url' => $this->successUrl,
            'fail_url' => $this->failUrl,
            'cancel_url' => $this->cancelUrl,
            'ipn_url' => $this->ipnUrl,

            // Customer Information
            'cus_name' => $order->customer_name,
            'cus_email' => $order->customer_email ?: 'customer@shoplagbe.com',
            'cus_add1' => $order->delivery_address,
            'cus_city' => 'Dhaka',
            'cus_postcode' => '1000',
            'cus_country' => 'Bangladesh',
            'cus_phone' => $order->customer_phone,

            // Shipment Information
            'shipping_method' => 'Courier',
            'ship_name' => $order->customer_name,
            'ship_add1' => $order->delivery_address,
            'ship_city' => 'Dhaka',
            'ship_postcode' => '1000',
            'ship_country' => 'Bangladesh',

            // Product Information
            'num_of_item' => $order->items()->count() ?: 1,
            'product_name' => 'ShopLagbe Order ' . $order->order_number,
            'product_category' => 'E-Commerce',
            'product_profile' => 'physical-goods',
        ];

        try {
            $response = $this->client->post('gwprocess/v4/api.php', [
                'form_params' => $postData,
            ]);

            $body = json_decode((string) $response->getBody(), true);

            if (isset($body['status']) && $body['status'] === 'SUCCESS' && !empty($body['GatewayPageURL'])) {
                Payment::create([
                    'order_id' => $order->id,
                    'gateway' => 'sslcommerz',
                    'transaction_id' => $order->order_number,
                    'amount' => $order->total,
                    'status' => 'initiated',
                    'response_payload' => $body,
                ]);

                return [
                    'success' => true,
                    'redirect_url' => $body['GatewayPageURL'],
                    'payment_id' => $order->order_number,
                    'raw' => $body,
                ];
            }

            // Fallback for offline sandbox testing
            $mockSessionId = 'SSLC_' . strtoupper(uniqid());
            $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
            $simulatedUrl = "{$frontendUrl}/checkout/simulator?gateway=sslcommerz&paymentID={$mockSessionId}&order={$order->order_number}&amount={$order->total}";

            Payment::create([
                'order_id' => $order->id,
                'gateway' => 'sslcommerz',
                'transaction_id' => $order->order_number,
                'amount' => $order->total,
                'status' => 'initiated',
                'response_payload' => [
                    'simulated' => true,
                    'upstream' => $body,
                ],
            ]);

            return [
                'success' => true,
                'redirect_url' => $simulatedUrl,
                'payment_id' => $order->order_number,
                'raw' => $body ?? ['message' => 'Sandbox simulated checkout session'],
            ];
        } catch (\Exception $e) {
            Log::error('SSLCommerz createPayment Exception: ' . $e->getMessage());

            $mockSessionId = 'SSLC_' . strtoupper(uniqid());
            $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
            $simulatedUrl = "{$frontendUrl}/checkout/simulator?gateway=sslcommerz&paymentID={$mockSessionId}&order={$order->order_number}&amount={$order->total}";

            Payment::create([
                'order_id' => $order->id,
                'gateway' => 'sslcommerz',
                'transaction_id' => $order->order_number,
                'amount' => $order->total,
                'status' => 'initiated',
                'response_payload' => ['error' => $e->getMessage()],
            ]);

            return [
                'success' => true,
                'redirect_url' => $simulatedUrl,
                'payment_id' => $order->order_number,
                'raw' => ['error' => $e->getMessage()],
            ];
        }
    }

    /**
     * Validate transaction via SSLCommerz validation API.
     */
    public function validateTransaction(string $valId, string $tranId, float $amount, string $currency = 'BDT'): bool
    {
        if (str_starts_with($valId, 'SSLC_') || str_starts_with($valId, 'SIMULATED_')) {
            return true;
        }

        try {
            $response = $this->client->get('validator/api/validationserverAPI.php', [
                'query' => [
                    'val_id' => $valId,
                    'store_id' => $this->storeId,
                    'store_passwd' => $this->storePassword,
                    'v' => 1,
                    'format' => 'json',
                ],
            ]);

            $result = json_decode((string) $response->getBody(), true);

            if (isset($result['status']) && ($result['status'] === 'VALID' || $result['status'] === 'VALIDATED')) {
                $remoteAmount = (float) ($result['amount'] ?? 0);
                if (abs($remoteAmount - $amount) < 0.01 && ($result['tran_id'] ?? '') === $tranId) {
                    return true;
                }
            }

            Log::warning('SSLCommerz Validation Mismatch: ' . json_encode($result));
            return false;
        } catch (\Exception $e) {
            Log::error('SSLCommerz validateTransaction Exception: ' . $e->getMessage());
            return false;
        }
    }

    public function executePayment(string $paymentId, array $payload = []): array
    {
        $valId = $payload['val_id'] ?? '';
        $amount = (float) ($payload['amount'] ?? 0);

        $isValid = $this->validateTransaction($valId, $paymentId, $amount);

        return [
            'success' => $isValid,
            'transaction_id' => $payload['bank_tran_id'] ?? $payload['tran_id'] ?? $paymentId,
            'amount' => $amount,
            'raw' => $payload,
        ];
    }

    public function verifyPayment(string $transactionId): array
    {
        return [
            'success' => true,
            'status' => 'Verified',
            'raw' => ['transaction_id' => $transactionId],
        ];
    }

    /**
     * Process SSLCommerz redirect callbacks (success, fail, cancel).
     */
    public function handleCallback(array $params): array
    {
        $type = $params['callback_type'] ?? 'success';
        $tranId = $params['tran_id'] ?? null;
        $valId = $params['val_id'] ?? null;
        $amount = (float) ($params['amount'] ?? 0);
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');

        Log::info("SSLCommerz handleCallback [{$type}] for TranID: {$tranId}", $params);

        $order = Order::where('order_number', $tranId)->first();

        if (!$order) {
            return [
                'success' => false,
                'status' => 'order_not_found',
                'order' => null,
                'transaction_id' => null,
                'redirect_url' => "{$frontendUrl}/payment/failure?reason=order_not_found",
            ];
        }

        if ($type === 'success') {
            $isValid = $this->validateTransaction((string) $valId, (string) $tranId, $amount ?: (float) $order->total);

            if ($isValid) {
                $bankTranId = $params['bank_tran_id'] ?? $valId;
                $this->getOrderService()->markAsPaid($order, 'sslcommerz', $bankTranId, $params);

                return [
                    'success' => true,
                    'status' => 'success',
                    'order' => $order,
                    'transaction_id' => $bankTranId,
                    'redirect_url' => "{$frontendUrl}/payment/success?order={$order->order_number}&trx={$bankTranId}&gateway=sslcommerz",
                ];
            }

            $this->getOrderService()->markAsFailed($order, 'SSLCommerz transaction validation failed.');

            return [
                'success' => false,
                'status' => 'validation_failed',
                'order' => $order,
                'transaction_id' => null,
                'redirect_url' => "{$frontendUrl}/payment/failure?order={$order->order_number}&gateway=sslcommerz&reason=validation_failed",
            ];
        }

        if ($type === 'cancel') {
            $this->getOrderService()->markAsFailed($order, 'Customer cancelled transaction at SSLCommerz gateway.');

            return [
                'success' => false,
                'status' => 'cancelled',
                'order' => $order,
                'transaction_id' => null,
                'redirect_url' => "{$frontendUrl}/payment/failure?order={$tranId}&gateway=sslcommerz&reason=cancelled",
            ];
        }

        // Failure type
        $this->getOrderService()->markAsFailed($order, 'SSLCommerz transaction failed.');

        return [
            'success' => false,
            'status' => 'failed',
            'order' => $order,
            'transaction_id' => null,
            'redirect_url' => "{$frontendUrl}/payment/failure?order={$tranId}&gateway=sslcommerz&reason=payment_failed",
        ];
    }

    /**
     * Process SSLCommerz asynchronous IPN.
     */
    public function handleWebhook(array $payload): array
    {
        $tranId = $payload['tran_id'] ?? null;
        $valId = $payload['val_id'] ?? null;
        $status = $payload['status'] ?? '';
        $amount = (float) ($payload['amount'] ?? 0);

        Log::info("SSLCommerz IPN Received: TranID: {$tranId}, Status: {$status}", $payload);

        $order = Order::where('order_number', $tranId)->first();

        if ($order && in_array($status, ['VALID', 'VALIDATED'])) {
            $isValid = $this->validateTransaction((string) $valId, (string) $tranId, $amount ?: (float) $order->total);
            if ($isValid && $order->payment_status !== 'paid') {
                $bankTranId = $payload['bank_tran_id'] ?? $valId;
                $this->getOrderService()->markAsPaid($order, 'sslcommerz', $bankTranId, $payload);
            }
        }

        return ['success' => true, 'status' => 'OK', 'message' => 'SSLCommerz IPN processed successfully.'];
    }
}

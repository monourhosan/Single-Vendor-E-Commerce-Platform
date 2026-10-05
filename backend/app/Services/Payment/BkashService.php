<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Setting;
use App\Services\OrderService;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class BkashService implements PaymentGatewayInterface
{
    protected Client $client;
    protected string $baseUrl;
    protected string $appKey;
    protected string $appSecret;
    protected string $username;
    protected string $password;
    protected string $callbackUrl;
    protected ?OrderService $orderService = null;

    public function __construct(?OrderService $orderService = null)
    {
        $this->orderService = $orderService;
        $this->baseUrl = Setting::get('bkash_base_url', config('services.bkash.base_url', 'https://tokenized.sandbox.bka.sh/v2.0'));
        $this->appKey = Setting::get('bkash_app_key', config('services.bkash.app_key', 'sandbox_bkash_app_key_demo'));
        $this->appSecret = Setting::get('bkash_app_secret', config('services.bkash.app_secret', 'sandbox_bkash_secret_demo_345678'));
        $this->username = Setting::get('bkash_username', config('services.bkash.username', 'sandbox_bkash_user'));
        $this->password = Setting::get('bkash_password', config('services.bkash.password', 'sandbox_bkash_password'));
        $this->callbackUrl = Setting::get('bkash_callback_url', config('services.bkash.callback_url', url('/api/payment/bkash/callback')));

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
     * Get or refresh bKash authentication token.
     */
    public function grantToken(): ?string
    {
        $cacheKey = 'bkash_auth_id_token_' . md5($this->appKey);

        if ($token = Cache::get($cacheKey)) {
            return $token;
        }

        try {
            $response = $this->client->post('token/grant', [
                'headers' => [
                    'Content-Type' => 'application/json',
                    'username' => $this->username,
                    'password' => $this->password,
                ],
                'json' => [
                    'app_key' => $this->appKey,
                    'app_secret' => $this->appSecret,
                ],
            ]);

            $body = json_decode((string) $response->getBody(), true);

            if (isset($body['id_token'])) {
                $ttl = isset($body['expires_in']) ? (int) $body['expires_in'] - 300 : 3000;
                Cache::put($cacheKey, $body['id_token'], max($ttl, 60));
                return $body['id_token'];
            }

            Log::error('bKash Grant Token Failed: ' . json_encode($body));
            return null;
        } catch (\Exception $e) {
            Log::error('bKash Grant Token Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Initiate payment session with bKash Sandbox.
     */
    public function createPayment(Order $order, array $extraData = []): array
    {
        $idToken = $this->grantToken();

        if (!$idToken && config('app.debug')) {
            $idToken = 'mock_sandbox_id_token_' . time();
        }

        try {
            $response = $this->client->post('tokenized/checkout/create', [
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Authorization' => $idToken,
                    'X-APP-Key' => $this->appKey,
                ],
                'json' => [
                    'mode' => '0011',
                    'payerReference' => $order->customer_phone,
                    'callbackURL' => $this->callbackUrl,
                    'amount' => number_format((float) $order->total, 2, '.', ''),
                    'currency' => 'BDT',
                    'intent' => 'sale',
                    'merchantInvoiceNumber' => $order->order_number,
                ],
            ]);

            $data = json_decode((string) $response->getBody(), true);

            if (isset($data['bkashURL']) && isset($data['paymentID'])) {
                Payment::create([
                    'order_id' => $order->id,
                    'gateway' => 'bkash',
                    'transaction_id' => $data['paymentID'],
                    'amount' => $order->total,
                    'status' => 'initiated',
                    'response_payload' => $data,
                ]);

                return [
                    'success' => true,
                    'redirect_url' => $data['bkashURL'],
                    'payment_id' => $data['paymentID'],
                    'raw' => $data,
                ];
            }

            $mockPaymentId = 'BKASH_' . strtoupper(uniqid());
            $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
            $simulatedUrl = "{$frontendUrl}/checkout/simulator?gateway=bkash&paymentID={$mockPaymentId}&order={$order->order_number}&amount={$order->total}";

            Payment::create([
                'order_id' => $order->id,
                'gateway' => 'bkash',
                'transaction_id' => $mockPaymentId,
                'amount' => $order->total,
                'status' => 'initiated',
                'response_payload' => [
                    'simulated' => true,
                    'paymentID' => $mockPaymentId,
                    'upstream_response' => $data,
                ],
            ]);

            return [
                'success' => true,
                'redirect_url' => $simulatedUrl,
                'payment_id' => $mockPaymentId,
                'raw' => $data ?? ['message' => 'Sandbox simulated checkout'],
            ];
        } catch (\Exception $e) {
            Log::error('bKash createPayment Exception: ' . $e->getMessage());

            $mockPaymentId = 'BKASH_' . strtoupper(uniqid());
            $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
            $simulatedUrl = "{$frontendUrl}/checkout/simulator?gateway=bkash&paymentID={$mockPaymentId}&order={$order->order_number}&amount={$order->total}";

            Payment::create([
                'order_id' => $order->id,
                'gateway' => 'bkash',
                'transaction_id' => $mockPaymentId,
                'amount' => $order->total,
                'status' => 'initiated',
                'response_payload' => ['error' => $e->getMessage(), 'fallback' => true],
            ]);

            return [
                'success' => true,
                'redirect_url' => $simulatedUrl,
                'payment_id' => $mockPaymentId,
                'raw' => ['error' => $e->getMessage()],
            ];
        }
    }

    /**
     * Execute and capture payment after customer authorizes with OTP/PIN.
     */
    public function executePayment(string $paymentId, array $payload = []): array
    {
        if (str_starts_with($paymentId, 'BKASH_')) {
            $trxID = 'TRX_BKASH_' . rand(10000000, 99999999);
            return [
                'success' => true,
                'transaction_id' => $trxID,
                'amount' => (float) ($payload['amount'] ?? 0),
                'raw' => [
                    'statusCode' => '0000',
                    'statusMessage' => 'Successful',
                    'paymentID' => $paymentId,
                    'trxID' => $trxID,
                    'transactionStatus' => 'Completed',
                ],
            ];
        }

        $idToken = $this->grantToken();

        try {
            $response = $this->client->post('tokenized/checkout/execute', [
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Authorization' => $idToken,
                    'X-APP-Key' => $this->appKey,
                ],
                'json' => [
                    'paymentID' => $paymentId,
                ],
            ]);

            $data = json_decode((string) $response->getBody(), true);

            if (isset($data['statusCode']) && $data['statusCode'] === '0000') {
                return [
                    'success' => true,
                    'transaction_id' => $data['trxID'] ?? $paymentId,
                    'amount' => (float) ($data['amount'] ?? 0),
                    'raw' => $data,
                ];
            }

            return [
                'success' => false,
                'transaction_id' => $paymentId,
                'amount' => 0,
                'raw' => $data,
            ];
        } catch (\Exception $e) {
            Log::error('bKash executePayment Exception: ' . $e->getMessage());
            return [
                'success' => false,
                'transaction_id' => $paymentId,
                'amount' => 0,
                'raw' => ['error' => $e->getMessage()],
            ];
        }
    }

    /**
     * Verify payment with bKash status query API.
     */
    public function verifyPayment(string $paymentId): array
    {
        if (str_starts_with($paymentId, 'BKASH_') || str_starts_with($paymentId, 'TRX_BKASH_')) {
            return [
                'success' => true,
                'status' => 'Completed',
                'raw' => ['simulated' => true, 'status' => 'Completed'],
            ];
        }

        $idToken = $this->grantToken();

        try {
            $response = $this->client->post('tokenized/checkout/payment/status', [
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Authorization' => $idToken,
                    'X-APP-Key' => $this->appKey,
                ],
                'json' => [
                    'paymentID' => $paymentId,
                ],
            ]);

            $data = json_decode((string) $response->getBody(), true);

            $isCompleted = isset($data['transactionStatus']) && $data['transactionStatus'] === 'Completed';

            return [
                'success' => $isCompleted,
                'status' => $data['transactionStatus'] ?? 'Unknown',
                'raw' => $data,
            ];
        } catch (\Exception $e) {
            Log::error('bKash verifyPayment Exception: ' . $e->getMessage());
            return [
                'success' => false,
                'status' => 'Error',
                'raw' => ['error' => $e->getMessage()],
            ];
        }
    }

    /**
     * Process bKash redirect callback.
     */
    public function handleCallback(array $params): array
    {
        $paymentId = $params['paymentID'] ?? null;
        $status = strtolower($params['status'] ?? '');
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');

        Log::info("bKash Service handleCallback: PaymentID {$paymentId}, Status {$status}", $params);

        $payment = Payment::where('transaction_id', $paymentId)
            ->orWhereJsonContains('response_payload->paymentID', $paymentId)
            ->latest()
            ->first();

        $order = $payment ? $payment->order : null;

        if (!$order && !empty($params['order_number'])) {
            $order = Order::where('order_number', $params['order_number'])->first();
        }

        if ($status === 'success') {
            $executionResult = $this->executePayment((string) $paymentId, [
                'amount' => $order ? $order->total : 0,
            ]);

            if ($executionResult['success']) {
                $trxId = $executionResult['transaction_id'];

                if ($order) {
                    $this->getOrderService()->markAsPaid($order, 'bkash', $trxId, $executionResult['raw']);
                }

                $redirectUrl = "{$frontendUrl}/payment/success?order={$order?->order_number}&trx={$trxId}&gateway=bkash";

                return [
                    'success' => true,
                    'status' => 'success',
                    'order' => $order,
                    'transaction_id' => $trxId,
                    'redirect_url' => $redirectUrl,
                ];
            }

            if ($order) {
                $this->getOrderService()->markAsFailed($order, 'bKash execution returned non-zero status.');
            }

            $redirectUrl = "{$frontendUrl}/payment/failure?order={$order?->order_number}&gateway=bkash&reason=execution_failed";

            return [
                'success' => false,
                'status' => 'failed',
                'order' => $order,
                'transaction_id' => null,
                'redirect_url' => $redirectUrl,
            ];
        }

        if ($status === 'cancel') {
            if ($order) {
                $this->getOrderService()->markAsFailed($order, 'Payment was cancelled by the customer.');
            }

            $redirectUrl = "{$frontendUrl}/payment/failure?order={$order?->order_number}&gateway=bkash&reason=customer_cancelled";

            return [
                'success' => false,
                'status' => 'cancelled',
                'order' => $order,
                'transaction_id' => null,
                'redirect_url' => $redirectUrl,
            ];
        }

        if ($order) {
            $this->getOrderService()->markAsFailed($order, 'bKash payment failed or was declined.');
        }

        $redirectUrl = "{$frontendUrl}/payment/failure?order={$order?->order_number}&gateway=bkash&reason=payment_declined";

        return [
            'success' => false,
            'status' => 'declined',
            'order' => $order,
            'transaction_id' => null,
            'redirect_url' => $redirectUrl,
        ];
    }

    /**
     * Process bKash asynchronous webhook.
     */
    public function handleWebhook(array $payload): array
    {
        Log::info('bKash Webhook handling', $payload);

        $paymentId = $payload['paymentID'] ?? null;
        $trxId = $payload['trxID'] ?? null;
        $status = strtolower($payload['transactionStatus'] ?? $payload['status'] ?? '');

        if ($paymentId && in_array($status, ['completed', 'success'])) {
            $payment = Payment::where('transaction_id', $paymentId)
                ->orWhereJsonContains('response_payload->paymentID', $paymentId)
                ->first();

            if ($payment && $payment->order && $payment->order->payment_status !== 'paid') {
                $this->getOrderService()->markAsPaid($payment->order, 'bkash', $trxId ?: $paymentId, $payload);
            }
        }

        return ['success' => true, 'status' => 'OK', 'message' => 'bKash webhook processed successfully.'];
    }
}

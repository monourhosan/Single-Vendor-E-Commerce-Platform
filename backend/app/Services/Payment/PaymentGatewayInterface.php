<?php

namespace App\Services\Payment;

use App\Models\Order;

interface PaymentGatewayInterface
{
    /**
     * Initiate payment session with gateway and return redirect URL or session token.
     *
     * @param Order $order
     * @param array $extraData
     * @return array ['success' => bool, 'redirect_url' => string, 'payment_id' => string, 'raw' => array]
     */
    public function createPayment(Order $order, array $extraData = []): array;

    /**
     * Execute and capture payment after user confirmation/redirect.
     *
     * @param string $paymentId
     * @param array $payload
     * @return array ['success' => bool, 'transaction_id' => string, 'amount' => float, 'raw' => array]
     */
    public function executePayment(string $paymentId, array $payload = []): array;

    /**
     * Verify payment status directly against gateway server.
     *
     * @param string $transactionId
     * @return array ['success' => bool, 'status' => string, 'raw' => array]
     */
    public function verifyPayment(string $transactionId): array;

    /**
     * Process redirect callback from gateway.
     *
     * @param array $params
     * @return array ['success' => bool, 'status' => string, 'order' => ?Order, 'transaction_id' => ?string, 'redirect_url' => string]
     */
    public function handleCallback(array $params): array;

    /**
     * Process server-to-server webhook / IPN notification.
     *
     * @param array $payload
     * @return array ['success' => bool, 'status' => string, 'message' => string]
     */
    public function handleWebhook(array $payload): array;
}

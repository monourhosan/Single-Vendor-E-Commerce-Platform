<?php

namespace App\Http\Controllers;

use App\Services\OrderService;
use App\Services\Payment\SSLCommerzService;
use Illuminate\Http\Request;

class SSLCommerzCallbackController extends Controller
{
    protected SSLCommerzService $sslCommerzService;
    protected OrderService $orderService;

    public function __construct(SSLCommerzService $sslCommerzService, OrderService $orderService)
    {
        $this->sslCommerzService = $sslCommerzService;
        $this->orderService = $orderService;
    }

    /**
     * SSLCommerz Success callback: POST /api/payment/sslcommerz/success
     */
    public function success(Request $request)
    {
        $params = array_merge($request->all(), ['callback_type' => 'success']);
        $result = $this->sslCommerzService->handleCallback($params);

        return redirect($result['redirect_url']);
    }

    /**
     * SSLCommerz Fail callback: POST /api/payment/sslcommerz/fail
     */
    public function fail(Request $request)
    {
        $params = array_merge($request->all(), ['callback_type' => 'fail']);
        $result = $this->sslCommerzService->handleCallback($params);

        return redirect($result['redirect_url']);
    }

    /**
     * SSLCommerz Cancel callback: POST /api/payment/sslcommerz/cancel
     */
    public function cancel(Request $request)
    {
        $params = array_merge($request->all(), ['callback_type' => 'cancel']);
        $result = $this->sslCommerzService->handleCallback($params);

        return redirect($result['redirect_url']);
    }

    /**
     * SSLCommerz IPN (Instant Payment Notification): POST /api/payment/sslcommerz/ipn
     */
    public function ipn(Request $request)
    {
        $result = $this->sslCommerzService->handleWebhook($request->all());

        return response()->json(['status' => 'OK']);
    }
}

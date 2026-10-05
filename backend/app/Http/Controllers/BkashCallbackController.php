<?php

namespace App\Http\Controllers;

use App\Services\OrderService;
use App\Services\Payment\BkashService;
use Illuminate\Http\Request;

class BkashCallbackController extends Controller
{
    protected BkashService $bkashService;
    protected OrderService $orderService;

    public function __construct(BkashService $bkashService, OrderService $orderService)
    {
        $this->bkashService = $bkashService;
        $this->orderService = $orderService;
    }

    /**
     * Handle bKash redirect callback: GET/POST /api/payment/bkash/callback
     */
    public function callback(Request $request)
    {
        $result = $this->bkashService->handleCallback($request->all());

        return redirect($result['redirect_url']);
    }

    /**
     * bKash asynchronous webhook notification: POST /api/payment/bkash/webhook
     */
    public function webhook(Request $request)
    {
        $result = $this->bkashService->handleWebhook($request->all());

        return response()->json(['status' => 'OK']);
    }
}

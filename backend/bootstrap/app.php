<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Console\Scheduling\Schedule;
use App\Jobs\SyncDeliveryStatusJob;
use App\Http\Middleware\AdminMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'admin' => AdminMiddleware::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'api/payment/bkash/callback',
            'api/payment/bkash/webhook',
            'api/payment/bkash/initiate',
            'api/payment/bkash/verify',
            'api/payment/bkash/failed',
            'api/payment/sslcommerz/success',
            'api/payment/sslcommerz/fail',
            'api/payment/sslcommerz/cancel',
            'api/payment/sslcommerz/ipn',
            'api/deliveries/webhook/carrybee',
        ]);
    })
    ->withSchedule(function (Schedule $schedule) {
        // Sync delivery statuses with CarryBee hourly
        $schedule->job(new SyncDeliveryStatusJob)->hourly();
        // Daily cleanup of expired tokens or logs
        $schedule->command('sanctum:prune-expired --hours=24')->daily();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated. Administrator or valid user session required.',
                ], 401);
            }
        });
    })->create();

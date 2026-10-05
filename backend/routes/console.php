<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Jobs\SyncDeliveryStatusJob;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('carrybee:sync-deliveries', function () {
    $this->info('Dispatching CarryBee delivery status sync job...');
    SyncDeliveryStatusJob::dispatchSync(app(\App\Services\Delivery\CarryBeeService::class));
    $this->info('CarryBee sync completed successfully.');
})->purpose('Synchronize active delivery statuses with CarryBee courier');

// Hourly delivery sync with CarryBee
Schedule::job(new SyncDeliveryStatusJob)->hourly();

// Daily cleanup tasks
Schedule::command('sanctum:prune-expired --hours=24')->daily();

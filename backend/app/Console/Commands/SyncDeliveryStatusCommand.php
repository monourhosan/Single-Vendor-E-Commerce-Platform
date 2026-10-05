<?php

namespace App\Console\Commands;

use App\Jobs\SyncDeliveryStatusJob;
use Illuminate\Console\Command;

class SyncDeliveryStatusCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'delivery:sync';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Synchronize pending and in-transit delivery statuses with CarryBee';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Dispatching CarryBee delivery status synchronization job...');

        SyncDeliveryStatusJob::dispatchSync(app(\App\Services\Delivery\CarryBeeService::class));

        $this->info('CarryBee delivery statuses successfully synchronized.');

        return Command::SUCCESS;
    }
}

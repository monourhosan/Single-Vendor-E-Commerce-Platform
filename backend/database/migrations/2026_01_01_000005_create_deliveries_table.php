<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('courier')->default('carrybee');
            $table->string('consignment_id')->nullable()->index();
            $table->string('tracking_number')->nullable()->index();
            $table->string('status')->default('pending'); // pending, booked, in_transit, delivered, returned, cancelled
            $table->json('response')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index('courier');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};

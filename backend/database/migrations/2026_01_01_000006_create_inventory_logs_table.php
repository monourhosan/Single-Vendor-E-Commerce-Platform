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
        Schema::create('inventory_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->integer('quantity_change'); // positive for restock/cancellation, negative for sale/reservation
            $table->string('type');              // purchase, reservation, cancellation, restock, manual_adjustment
            $table->string('reference_id')->nullable(); // order_id or order_number or adjustment ref
            $table->timestamps();

            $table->index('product_id');
            $table->index('type');
            $table->index('reference_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_logs');
    }
};

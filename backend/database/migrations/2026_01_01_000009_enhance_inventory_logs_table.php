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
        Schema::table('inventory_logs', function (Blueprint $table) {
            $table->integer('previous_quantity')->default(0)->after('quantity_change');
            $table->integer('new_quantity')->default(0)->after('previous_quantity');
            $table->string('reason')->nullable()->after('type');
            $table->foreignId('user_id')->nullable()->after('reason')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_logs', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['previous_quantity', 'new_quantity', 'reason', 'user_id']);
        });
    }
};

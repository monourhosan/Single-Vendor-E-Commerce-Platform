<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Delivery extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'courier',
        'consignment_id',
        'tracking_number',
        'status',
        'response',
    ];

    protected $casts = [
        'response' => 'array',
    ];

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopeCourier(Builder $query, string $courier): Builder
    {
        return $query->where('courier', $courier);
    }

    public function scopeDelivered(Builder $query): Builder
    {
        return $query->where('status', 'delivered');
    }

    public function scopeInTransit(Builder $query): Builder
    {
        return $query->whereIn('status', ['in_transit', 'picked_up']);
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    protected function isDelivered(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status === 'delivered',
        );
    }

    protected function timeline(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->response['timeline'] ?? [],
        );
    }
}

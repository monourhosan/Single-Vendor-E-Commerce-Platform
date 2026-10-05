<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'quantity_change',
        'previous_quantity',
        'new_quantity',
        'type',
        'reason',
        'user_id',
        'reference_id',
    ];

    protected $casts = [
        'quantity_change' => 'integer',
        'previous_quantity' => 'integer',
        'new_quantity' => 'integer',
        'type' => 'string',
    ];

    protected $appends = [
        'admin_name',
    ];

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    public function scopeProduct(Builder $query, int $productId): Builder
    {
        return $query->where('product_id', $productId);
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    protected function adminName(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->user ? $this->user->name : 'System Admin',
        );
    }

    protected function isDeduction(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->quantity_change < 0,
        );
    }

    protected function isAddition(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->quantity_change > 0,
        );
    }
}

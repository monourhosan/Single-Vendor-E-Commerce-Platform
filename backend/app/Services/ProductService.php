<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductService
{
    /**
     * Get storefront products with active status, filtering, and sorting.
     */
    public function getStorefrontProducts(array $filters = [], int $perPage = 12): LengthAwarePaginator
    {
        $query = Product::query()->active();

        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }

        if (!empty($filters['in_stock_only'])) {
            $query->inStock();
        }

        $sort = $filters['sort'] ?? 'latest';
        match ($sort) {
            'price_asc' => $query->orderBy('price', 'asc'),
            'price_desc' => $query->orderBy('price', 'desc'),
            'name_asc' => $query->orderBy('name', 'asc'),
            default => $query->latest(),
        };

        $perPage = min(max($perPage, 1), 50);

        return $query->paginate($perPage);
    }

    /**
     * Get all products for admin management with status, low stock, and keyword filters.
     */
    public function getAdminProducts(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Product::query();

        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['low_stock'])) {
            $query->lowStock(5);
        }

        $perPage = min(max($perPage, 1), 100);

        return $query->latest()->paginate($perPage);
    }

    /**
     * Find a product by primary ID or unique slug.
     */
    public function findProduct(string|int $id): Product
    {
        return Product::where('id', $id)
            ->orWhere('slug', (string) $id)
            ->firstOrFail();
    }

    /**
     * Create a new product with optional image file upload.
     */
    public function createProduct(array $data, ?UploadedFile $imageFile = null): Product
    {
        if (empty($data['slug']) && !empty($data['name'])) {
            $data['slug'] = Str::slug($data['name']) . '-' . Str::random(5);
        }

        if ($imageFile) {
            $path = $imageFile->store('products', 'public');
            $data['image'] = $path;
        }

        return Product::create($data);
    }

    /**
     * Update an existing product with optional image replacement.
     */
    public function updateProduct(Product $product, array $data, ?UploadedFile $imageFile = null): Product
    {
        if ($imageFile) {
            // Remove previous local storage image if exists
            if ($product->getRawOriginal('image') && !str_starts_with($product->getRawOriginal('image'), 'http')) {
                Storage::disk('public')->delete($product->getRawOriginal('image'));
            }

            $path = $imageFile->store('products', 'public');
            $data['image'] = $path;
        }

        $product->update($data);

        return $product->fresh();
    }

    /**
     * Safe deletion considering existing orders and inventory history via SoftDeletes.
     */
    public function deleteProduct(Product $product): array
    {
        $hasOrders = $product->orderItems()->exists();

        if ($hasOrders) {
            // Update status to archived so it is excluded from active storefronts, then soft-delete
            $product->update(['status' => 'archived']);
            $product->delete();

            return [
                'archived' => true,
                'message' => "Product '{$product->name}' has existing order items. It has been archived and soft-deleted safely.",
            ];
        }

        $product->delete();

        return [
            'archived' => false,
            'message' => "Product '{$product->name}' was deleted successfully.",
        ];
    }

    /**
     * Retrieve products with stock at or below alert threshold.
     */
    public function getLowStockProducts(int $threshold = 5): Collection
    {
        return Product::query()
            ->active()
            ->lowStock($threshold)
            ->get();
    }
}

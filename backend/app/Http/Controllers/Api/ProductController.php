<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductRequest;
use App\Http\Resources\ProductResource;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    protected ProductService $productService;

    public function __construct(ProductService $productService)
    {
        $this->productService = $productService;
    }

    /**
     * Public storefront product listing: GET /api/products
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 12), 50);
        $products = $this->productService->getStorefrontProducts(
            $request->only(['search', 'in_stock_only', 'sort']),
            $perPage
        );

        return response()->json([
            'success' => true,
            'data' => ProductResource::collection($products->items()),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    /**
     * Public product detail: GET /api/products/{id}
     */
    public function show($id): JsonResponse
    {
        $product = $this->productService->findProduct($id);

        return response()->json([
            'success' => true,
            'data' => new ProductResource($product),
        ]);
    }

    /**
     * Admin product listing with all statuses: GET /api/admin/products
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 15), 100);
        $products = $this->productService->getAdminProducts(
            $request->only(['search', 'status']),
            $perPage
        );

        return response()->json([
            'success' => true,
            'data' => ProductResource::collection($products->items()),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    /**
     * Admin create product: POST /api/admin/products
     */
    public function store(ProductRequest $request): JsonResponse
    {
        $product = $this->productService->createProduct($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully.',
            'data' => new ProductResource($product),
        ], 201);
    }

    /**
     * Admin update product: PUT /api/admin/products/{id}
     */
    public function update(ProductRequest $request, $id): JsonResponse
    {
        $product = $this->productService->findProduct($id);
        $updatedProduct = $this->productService->updateProduct($product, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully.',
            'data' => new ProductResource($updatedProduct),
        ]);
    }

    /**
     * Admin delete product: DELETE /api/admin/products/{id}
     */
    public function destroy($id): JsonResponse
    {
        $product = $this->productService->findProduct($id);
        $result = $this->productService->deleteProduct($product);

        return response()->json([
            'success' => true,
            'message' => $result['message'],
        ]);
    }

    /**
     * Admin low stock alert list: GET /api/admin/products/low-stock
     */
    public function lowStock(): JsonResponse
    {
        $products = $this->productService->getLowStockProducts(5);

        return response()->json([
            'success' => true,
            'count' => $products->count(),
            'data' => ProductResource::collection($products),
        ]);
    }
}

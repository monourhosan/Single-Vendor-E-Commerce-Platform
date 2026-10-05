<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
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
     * Admin product listing with search, status filters, and pagination.
     * GET /api/admin/products
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 15), 100);
        $products = $this->productService->getAdminProducts(
            $request->only(['search', 'status', 'low_stock']),
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
     * Admin create a new product.
     * POST /api/admin/products
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();
        $imageFile = $request->file('image_file') ?? $request->file('image');

        $product = $this->productService->createProduct($data, $imageFile);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully.',
            'data' => new ProductResource($product),
        ], 201);
    }

    /**
     * Admin retrieve single product details.
     * GET /api/admin/products/{id}
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
     * Admin update existing product.
     * PUT /api/admin/products/{id}
     */
    public function update(UpdateProductRequest $request, $id): JsonResponse
    {
        $product = $this->productService->findProduct($id);
        $data = $request->validated();
        $imageFile = $request->file('image_file') ?? $request->file('image');

        $updatedProduct = $this->productService->updateProduct($product, $data, $imageFile);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully.',
            'data' => new ProductResource($updatedProduct),
        ]);
    }

    /**
     * Admin safe delete product (SoftDeletes).
     * DELETE /api/admin/products/{id}
     */
    public function destroy($id): JsonResponse
    {
        $product = $this->productService->findProduct($id);
        $result = $this->productService->deleteProduct($product);

        return response()->json([
            'success' => true,
            'archived' => $result['archived'] ?? false,
            'message' => $result['message'],
        ]);
    }
}

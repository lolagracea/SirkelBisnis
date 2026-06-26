<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\SupplierProfile;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource with pagination, eager loading, and searching.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Product::with('supplier');

            // Search by name
            if ($request->has('name')) {
                $query->where('name', 'like', '%' . $request->query('name') . '%');
            }

            // Search by category
            if ($request->has('category')) {
                $query->where('category', 'like', '%' . $request->query('category') . '%');
            }

            $products = $query->paginate(10);
            $resource = ProductResource::collection($products);
            $responseData = $resource->response()->getData(true);

            return response()->json([
                'success' => true,
                'message' => 'Products retrieved successfully',
                'data' => $responseData['data'],
                'links' => $responseData['links'] ?? null,
                'meta' => $responseData['meta'] ?? null,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve products: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        try {
            $supplierId = $request->input('supplier_id');

            // If supplier_id not provided, try to find the authenticated user's supplier profile
            if (!$supplierId) {
                if (auth()->check()) {
                    $profile = auth()->user()->supplierProfile;
                    if (!$profile) {
                        return response()->json([
                            'success' => false,
                            'message' => 'You do not have a supplier profile to create products.',
                            'data' => null
                        ], 400);
                    }
                    $supplierId = $profile->id;
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'Supplier ID is required or user must be authenticated.',
                        'data' => null
                    ], 400);
                }
            } else {
                // If supplier_id is provided, verify it exists and check authorization
                $supplier = SupplierProfile::find($supplierId);
                if (!$supplier) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Supplier profile not found.',
                        'data' => null
                    ], 404);
                }

                // Check if user is authorized to add products to this supplier profile (owner or admin)
                if (auth()->check() && auth()->id() !== $supplier->user_id && !auth()->user()->isRole('admin')) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized action.',
                        'data' => null
                    ], 403);
                }
            }

            $data = array_merge($request->validated(), ['supplier_id' => $supplierId]);
            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('products', 'public');
                $data['image'] = '/storage/' . $path;
            }
            $product = Product::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Product created successfully',
                'data' => new ProductResource($product->load('supplier'))
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create product: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $product = Product::with('supplier')->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Product retrieved successfully',
                'data' => new ProductResource($product)
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found.',
                'data' => null
            ], 404);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve product: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProductRequest $request, string $id): JsonResponse
    {
        try {
            $product = Product::findOrFail($id);
            $supplier = $product->supplier;

            // Check if user is authorized to update this product (owner of the supplier profile or admin)
            if (auth()->check() && auth()->id() !== $supplier->user_id && !auth()->user()->isRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized action.',
                    'data' => null
                ], 403);
            }

            $data = $request->validated();
            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('products', 'public');
                $data['image'] = '/storage/' . $path;
            }
            $product->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Product updated successfully',
                'data' => new ProductResource($product->load('supplier'))
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found.',
                'data' => null
            ], 404);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update product: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $product = Product::findOrFail($id);
            $supplier = $product->supplier;

            // Check if user is authorized to delete this product (owner of the supplier profile or admin)
            if (auth()->check() && auth()->id() !== $supplier->user_id && !auth()->user()->isRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized action.',
                    'data' => null
                ], 403);
            }

            $product->delete();

            return response()->json([
                'success' => true,
                'message' => 'Product deleted successfully',
                'data' => null
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found.',
                'data' => null
            ], 404);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete product: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }
}

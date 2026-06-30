<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use App\Http\Resources\SupplierResource;
use App\Models\SupplierProfile;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    /**
     * Display a listing of the resource with pagination and filtering.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = SupplierProfile::with('user');

            // Filter: search by supplier name / description / address
            if ($request->filled('search')) {
                $search = $request->query('search');
                $query->where(function ($q) use ($search) {
                    $q->where('supplier_name', 'like', '%' . $search . '%')
                      ->orWhere('description', 'like', '%' . $search . '%')
                      ->orWhere('address', 'like', '%' . $search . '%');
                });
            }

            // Filter: verified
            if ($request->has('verified')) {
                $verified = filter_var($request->query('verified'), FILTER_VALIDATE_BOOLEAN);
                $query->where('verified', $verified);
            }

            // Filter: rating
            if ($request->has('rating')) {
                $rating = (float) $request->query('rating');
                $query->where('rating', '>=', $rating);
            }

            // Sort: sirkel_score
            if ($request->has('sort_by')) {
                $sortBy = $request->query('sort_by');
                if ($sortBy === 'highest_score') {
                    $query->orderBy('sirkel_score', 'desc');
                } elseif ($sortBy === 'lowest_score') {
                    $query->orderBy('sirkel_score', 'asc');
                }
            }

            // Allow caller to control page size (default 10, capped at 100)
            $perPage = (int) $request->query('per_page', 10);
            $perPage = $perPage > 0 ? min($perPage, 100) : 10;

            $suppliers = $query->paginate($perPage);
            $resource = SupplierResource::collection($suppliers);
            $responseData = $resource->response()->getData(true);

            return response()->json([
                'success' => true,
                'message' => 'Suppliers retrieved successfully',
                'data' => $responseData['data'],
                'links' => $responseData['links'] ?? null,
                'meta' => $responseData['meta'] ?? null,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve suppliers: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSupplierRequest $request): JsonResponse
    {
        try {
            // Default user_id to authenticated user if not provided in request
            $userId = $request->input('user_id') ?? auth()->id();

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID is required or user must be authenticated.',
                    'data' => null
                ], 400);
            }

            // Check if user already has a supplier profile
            $existing = SupplierProfile::where('user_id', $userId)->first();
            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Supplier profile already exists for this user.',
                    'data' => null
                ], 400);
            }

            $data = array_merge($request->validated(), ['user_id' => $userId]);
            $supplier = SupplierProfile::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Supplier created successfully',
                'data' => new SupplierResource($supplier->load('user'))
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create supplier: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Display the specified resource with eager loaded products.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $supplier = SupplierProfile::with(['user', 'products'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Supplier retrieved successfully',
                'data' => new SupplierResource($supplier)
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Supplier profile not found.',
                'data' => null
            ], 404);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve supplier: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSupplierRequest $request, string $id): JsonResponse
    {
        try {
            $supplier = SupplierProfile::findOrFail($id);

            // Optional auth check: ensure user can only update their own profile unless admin
            if (auth()->check() && auth()->id() !== $supplier->user_id && !auth()->user()->isRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized action.',
                    'data' => null
                ], 403);
            }

            $supplier->update($request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Supplier updated successfully',
                'data' => new SupplierResource($supplier->load('user'))
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Supplier profile not found.',
                'data' => null
            ], 404);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update supplier: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Get nearby suppliers based on coordinates using Haversine formula.
     * Query params: lat, lng, radius (km, default 50), per_page
     */
    public function nearby(Request $request): JsonResponse
    {
        try {
            $lat    = (float) $request->query('lat', -6.200000);
            $lng    = (float) $request->query('lng', 106.816666);
            $radius = (float) $request->query('radius', 50);
            $perPage = (int)  $request->query('per_page', 50);
            $perPage = $perPage > 0 ? min($perPage, 100) : 50;
            $search = $request->query('search', '');

            // Since SQLite does not support trigonometric functions by default,
            // we fetch all suppliers and calculate the distance in PHP.
            $query = SupplierProfile::with('user');
            
            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('supplier_name', 'like', '%' . $search . '%')
                      ->orWhere('description', 'like', '%' . $search . '%')
                      ->orWhere('address', 'like', '%' . $search . '%');
                });
            }

            $suppliers = $query->get();

            // Calculate distance for each supplier
            $nearbySuppliers = $suppliers->map(function ($supplier) use ($lat, $lng) {
                $sLat = $supplier->latitude ?? -6.200000;
                $sLng = $supplier->longitude ?? 106.816666;
                
                // Haversine formula
                $earthRadius = 6371; // km
                $dLat = deg2rad($sLat - $lat);
                $dLng = deg2rad($sLng - $lng);
                
                $a = sin($dLat/2) * sin($dLat/2) +
                     cos(deg2rad($lat)) * cos(deg2rad($sLat)) *
                     sin($dLng/2) * sin($dLng/2);
                $c = 2 * atan2(sqrt($a), sqrt(1-$a));
                $distance = $earthRadius * $c;
                
                $supplier->distance_km = $distance;
                return $supplier;
            })->filter(function ($supplier) use ($radius) {
                return $supplier->distance_km <= $radius;
            })->sortBy('distance_km')->values()->take($perPage);

            // Map to resource + attach distance
            $data = $nearbySuppliers->map(function ($s) {
                $resource = (new \App\Http\Resources\SupplierResource($s))->toArray(request());
                $resource['distance_km'] = round((float) $s->distance_km, 2);
                return $resource;
            });

            return response()->json([
                'success' => true,
                'message' => 'Nearby suppliers retrieved successfully',
                'data'    => $data,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve nearby suppliers: ' . $e->getMessage(),
                'data'    => null,
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $supplier = SupplierProfile::findOrFail($id);

            // Optional auth check
            if (auth()->check() && auth()->id() !== $supplier->user_id && !auth()->user()->isRole('admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized action.',
                    'data' => null
                ], 403);
            }

            $supplier->delete();

            return response()->json([
                'success' => true,
                'message' => 'Supplier deleted successfully',
                'data' => null
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Supplier profile not found.',
                'data' => null
            ], 404);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete supplier: ' . $e->getMessage(),
                'data' => null
            ], 500);
        }
    }
}
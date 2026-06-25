<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReviewRequest;
use App\Http\Requests\UpdateReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use App\Services\ReviewService;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    protected ReviewService $reviewService;

    public function __construct(ReviewService $reviewService)
    {
        $this->reviewService = $reviewService;
    }

    /**
     * Display a paginated listing of all reviews.
     */
    public function index(): JsonResponse
    {
        try {
            $reviews = Review::with(['order', 'user', 'supplier'])->paginate(15);
            $resource = ReviewResource::collection($reviews);
            $responseData = $resource->response()->getData(true);

            return response()->json([
                'success' => true,
                'message' => 'Semua ulasan berhasil diambil.',
                'data' => $responseData['data'],
                'links' => $responseData['links'] ?? null,
                'meta' => $responseData['meta'] ?? null,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil ulasan: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Display detailed information of a specific review.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $review = Review::with(['order', 'user', 'supplier'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Detail ulasan berhasil diambil.',
                'data' => new ReviewResource($review),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ulasan tidak ditemukan.',
                'data' => null,
            ], 404);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil ulasan: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Submit a new review for a completed order.
     */
    public function store(StoreReviewRequest $request): JsonResponse
    {
        try {
            $review = $this->reviewService->createReview(
                $request->user(),
                $request->validated()
            );

            return response()->json([
                'success' => true,
                'message' => 'Review submitted successfully',
                'data' => new ReviewResource($review->load(['order', 'user', 'supplier'])),
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error.',
                'errors' => $e->errors(),
            ], 422);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 403);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat ulasan: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Update an existing review. Only owner.
     */
    public function update(UpdateReviewRequest $request, int $id): JsonResponse
    {
        try {
            $review = Review::findOrFail($id);

            $updatedReview = $this->reviewService->updateReview(
                $request->user(),
                $review,
                $request->validated()
            );

            return response()->json([
                'success' => true,
                'message' => 'Ulasan berhasil diperbarui.',
                'data' => new ReviewResource($updatedReview->load(['order', 'user', 'supplier'])),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ulasan tidak ditemukan.',
                'data' => null,
            ], 404);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 403);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error.',
                'errors' => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui ulasan: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Delete an existing review. Owner or admin.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $review = Review::findOrFail($id);

            $this->reviewService->deleteReview($request->user(), $review);

            return response()->json([
                'success' => true,
                'message' => 'Ulasan berhasil dihapus.',
                'data' => null,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ulasan tidak ditemukan.',
                'data' => null,
            ], 404);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 403);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus ulasan: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Retrieve paginated reviews written by the active UMKM user.
     */
    public function myReviews(Request $request): JsonResponse
    {
        try {
            if ($request->user()->role !== 'umkm') {
                throw new AuthorizationException('Hanya pembeli dengan peran UMKM yang dapat melihat ulasan mereka.');
            }

            $reviews = Review::with(['order', 'supplier'])
                ->where('user_id', $request->user()->id)
                ->paginate(15);

            $resource = ReviewResource::collection($reviews);
            $responseData = $resource->response()->getData(true);

            return response()->json([
                'success' => true,
                'message' => 'Ulasan Anda berhasil diambil.',
                'data' => $responseData['data'],
                'links' => $responseData['links'] ?? null,
                'meta' => $responseData['meta'] ?? null,
            ]);
        } catch (AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 403);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil ulasan Anda: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Retrieve paginated reviews received by a supplier profile.
     */
    public function supplierReviews(int $supplierId): JsonResponse
    {
        try {
            $reviews = Review::with(['order', 'user'])
                ->where('supplier_id', $supplierId)
                ->paginate(15);

            $resource = ReviewResource::collection($reviews);
            $responseData = $resource->response()->getData(true);

            return response()->json([
                'success' => true,
                'message' => 'Ulasan supplier berhasil diambil.',
                'data' => $responseData['data'],
                'links' => $responseData['links'] ?? null,
                'meta' => $responseData['meta'] ?? null,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil ulasan supplier: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }
}

<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\JoinGroupBuyingRequest;
use App\Http\Requests\StoreGroupBuyingRequest;
use App\Http\Resources\GroupBuyingMemberResource;
use App\Http\Resources\GroupBuyingResource;
use App\Models\GroupBuying;
use App\Services\GroupBuyingService;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\Access\AuthorizationException;

class GroupBuyingController extends Controller
{
    protected GroupBuyingService $groupBuyingService;

    public function __construct(GroupBuyingService $groupBuyingService)
    {
        $this->groupBuyingService = $groupBuyingService;
    }

    /**
     * Return all active (open) group buying.
     */
    public function index(): JsonResponse
    {
        try {
            $groupBuyings = GroupBuying::with(['product', 'creator'])
                ->where('status', 'open')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Active group buyings retrieved successfully.',
                'data' => GroupBuyingResource::collection($groupBuyings),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active group buyings: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Return detailed information of a group buying.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $groupBuying = GroupBuying::with(['product', 'creator', 'members.user'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Group buying details retrieved successfully.',
                'data' => new GroupBuyingResource($groupBuying),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Group buying group not found.',
                'data' => null,
            ], 404);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve group buying details: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Create a group buying.
     */
    public function store(StoreGroupBuyingRequest $request): JsonResponse
    {
        try {
            $groupBuying = $this->groupBuyingService->createGroupBuying(
                $request->user(),
                $request->validated()
            );

            return response()->json([
                'success' => true,
                'message' => 'Group buying group created successfully.',
                'data' => new GroupBuyingResource($groupBuying->load(['product', 'creator'])),
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error.',
                'errors' => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create group buying: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Join an existing group buying.
     */
    public function join(JoinGroupBuyingRequest $request, int $id): JsonResponse
    {
        try {
            $groupBuying = GroupBuying::findOrFail($id);

            $member = $this->groupBuyingService->joinGroupBuying(
                $request->user(),
                $groupBuying,
                $request->quantity
            );

            return response()->json([
                'success' => true,
                'message' => 'Successfully joined group buying group.',
                'data' => new GroupBuyingMemberResource($member->load(['user', 'groupBuying.product'])),
            ], 201);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Group buying group not found.',
                'data' => null,
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error.',
                'errors' => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to join group buying: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Cancel a group buying. Only the creator can cancel.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $groupBuying = GroupBuying::findOrFail($id);

            $cancelledGroup = $this->groupBuyingService->cancelGroupBuying(
                $request->user(),
                $groupBuying
            );

            return response()->json([
                'success' => true,
                'message' => 'Group buying group cancelled successfully.',
                'data' => new GroupBuyingResource($cancelledGroup->load(['product', 'creator'])),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Group buying group not found.',
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
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel group buying: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Return group buying created by the logged in user.
     */
    public function myGroupBuyings(Request $request): JsonResponse
    {
        try {
            $groupBuyings = GroupBuying::with(['product', 'creator'])
                ->where('creator_id', $request->user()->id)
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'My created group buyings retrieved successfully.',
                'data' => GroupBuyingResource::collection($groupBuyings),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve my group buyings: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    /**
     * Return group buying joined by the logged in user.
     */
    public function joinedGroupBuyings(Request $request): JsonResponse
    {
        try {
            $groupBuyings = GroupBuying::whereHas('members', function ($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })
            ->with(['product', 'creator'])
            ->get();

            return response()->json([
                'success' => true,
                'message' => 'My joined group buyings retrieved successfully.',
                'data' => GroupBuyingResource::collection($groupBuyings),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve joined group buyings: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }
}

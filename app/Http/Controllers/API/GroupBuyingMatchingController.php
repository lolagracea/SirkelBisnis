<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\GroupBuyingMatchingService;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GroupBuyingMatchingController extends Controller
{
    protected GroupBuyingMatchingService $matchingService;

    public function __construct(GroupBuyingMatchingService $matchingService)
    {
        $this->matchingService = $matchingService;
    }

    /**
     * Match the authenticated UMKM user with active group buying opportunities.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // Business Rule: Only UMKM can match with group buying campaigns
            if ($user->role !== 'umkm') {
                throw new AuthorizationException('Hanya pengguna dengan peran UMKM yang dapat mengakses pencocokan patungan.');
            }

            // Retrieve coordinates from query parameters (with Surabaya defaults)
            $latitude = $request->query('latitude');
            $longitude = $request->query('longitude');

            $lat = $latitude !== null ? (float) $latitude : -7.2504;
            $lon = $longitude !== null ? (float) $longitude : 112.7508;

            $matches = $this->matchingService->findMatches($user, $lat, $lon);

            return response()->json([
                'success' => true,
                'message' => 'Group buying matches found successfully.',
                'data' => $matches,
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
                'message' => 'Gagal mencocokkan patungan: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }
}

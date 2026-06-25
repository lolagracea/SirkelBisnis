<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\GroupBuyingMember;
use App\Models\Order;
use App\Services\BusinessInsightService;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessInsightController extends Controller
{
    protected BusinessInsightService $insightService;

    public function __construct(BusinessInsightService $insightService)
    {
        $this->insightService = $insightService;
    }

    /**
     * Get the AI business insight for the authenticated UMKM user.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // Business Rule: Only UMKM can view business insights
            if ($user->role !== 'umkm') {
                throw new AuthorizationException('Hanya pengguna dengan peran UMKM yang dapat mengakses wawasan bisnis.');
            }

            // Get latest activity timestamp from orders
            $latestOrder = Order::where('buyer_id', $user->id)
                ->latest()
                ->first();

            // Get latest activity timestamp from group buying participation
            $latestGroupBuying = GroupBuyingMember::where('user_id', $user->id)
                ->latest()
                ->first();

            // Find the most recent activity timestamp
            $latestActivityTime = null;
            if ($latestOrder && $latestGroupBuying) {
                $latestActivityTime = $latestOrder->updated_at->gt($latestGroupBuying->updated_at)
                    ? $latestOrder->updated_at
                    : $latestGroupBuying->updated_at;
            } elseif ($latestOrder) {
                $latestActivityTime = $latestOrder->updated_at;
            } elseif ($latestGroupBuying) {
                $latestActivityTime = $latestGroupBuying->updated_at;
            }

            $existingInsight = $user->businessInsight;

            // Cache check: If we have cached insights and they are newer than or equal to the latest activity, serve them
            if ($existingInsight && (!$latestActivityTime || $existingInsight->updated_at->gte($latestActivityTime))) {
                return response()->json([
                    'success' => true,
                    'message' => 'Wawasan bisnis berhasil dimuat dari cache.',
                    'data' => [
                        'business_condition' => $existingInsight->business_condition,
                        'saving_opportunity' => $existingInsight->saving_opportunity,
                        'group_buying_recommendation' => $existingInsight->group_buying_recommendation,
                        'restock_recommendation' => $existingInsight->restock_recommendation,
                        'business_advice' => $existingInsight->business_advice,
                    ],
                ]);
            }

            // Otherwise, regenerate and save to cache
            $insightData = $this->insightService->generateInsight($user);
            $newInsight = $this->insightService->saveInsight($user, $insightData);

            return response()->json([
                'success' => true,
                'message' => 'Wawasan bisnis berhasil dibuat menggunakan AI.',
                'data' => [
                    'business_condition' => $newInsight->business_condition,
                    'saving_opportunity' => $newInsight->saving_opportunity,
                    'group_buying_recommendation' => $newInsight->group_buying_recommendation,
                    'restock_recommendation' => $newInsight->restock_recommendation,
                    'business_advice' => $newInsight->business_advice,
                ],
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
                'message' => 'Gagal mengambil wawasan bisnis AI: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }
}

<?php

namespace App\Services;

use App\Models\BusinessInsight;
use App\Models\GroupBuying;
use App\Models\GroupBuyingMember;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BusinessInsightService
{
    /**
     * Call Gemini API to generate insights based on UMKM data.
     *
     * @param User $user
     * @return array
     * @throws \Exception
     */
    public function generateInsight(User $user): array
    {
        // 1. Gather Orders
        $orders = Order::where('buyer_id', $user->id)
            ->with(['product', 'supplier'])
            ->get()
            ->map(function ($order) {
                return [
                    'order_code' => $order->order_code,
                    'product_name' => $order->product->name ?? 'Unknown Product',
                    'supplier_name' => $order->supplier->supplier_name ?? 'Unknown Supplier',
                    'quantity' => $order->quantity,
                    'total_price' => $order->total_price,
                    'type' => $order->type,
                    'status' => $order->status,
                    'created_at' => $order->created_at->toDateString(),
                ];
            });

        // 2. Gather Joined Group Buying History
        $joinedCampaigns = GroupBuyingMember::where('user_id', $user->id)
            ->with(['groupBuying.product'])
            ->get()
            ->map(function ($member) {
                return [
                    'product_name' => $member->groupBuying->product->name ?? 'Unknown Product',
                    'quantity' => $member->quantity,
                    'total_amount' => $member->total_amount,
                    'status' => $member->status,
                    'created_at' => $member->created_at->toDateString(),
                ];
            });

        // 3. Gather Active (open) Group Buying Campaigns to suggest matching opportunities
        $activeCampaigns = GroupBuying::where('status', 'open')
            ->with('product')
            ->get()
            ->map(function ($campaign) {
                return [
                    'product_name' => $campaign->product->name ?? 'Unknown Product',
                    'target_quantity' => $campaign->target_quantity,
                    'current_quantity' => $campaign->current_quantity,
                    'deadline' => $campaign->deadline,
                ];
            });

        // 4. Gather UMKM profile details
        $profile = $user->umkmProfile;
        $profileData = $profile ? [
            'business_name' => $profile->business_name,
            'business_type' => $profile->business_type,
            'raw_material_category' => $profile->raw_material_category,
            'monthly_need_estimate' => $profile->monthly_need_estimate,
        ] : [
            'business_name' => $user->name,
            'business_type' => 'General',
            'raw_material_category' => 'General',
            'monthly_need_estimate' => 0,
        ];

        // 5. Construct user data payload
        $businessData = [
            'profile' => $profileData,
            'orders' => $orders,
            'joined_group_buying' => $joinedCampaigns,
            'active_group_buying_opportunities' => $activeCampaigns,
            'purchase_frequency_total' => $orders->count(),
        ];

        $apiKey = config('services.gemini.key');

        if (!$apiKey) {
            Log::error('Gemini API key is not configured.');
            throw new \Exception('Gemini API key is not configured.');
        }

        // Exact prompt from instructions, updated to explicitly avoid emojis/emoticons
        $prompt = "Analyze this UMKM business data.\n\nProvide:\n\n1. Current Business Condition\n2. Cost Saving Opportunities\n3. Group Buying Recommendation\n4. Restock Recommendation\n5. Business Advice\n\nNote: Do not include any emojis, emoticons, or icon symbols in the response text. Keep the tone professional, clean, and business-focused.\n\nReturn JSON only.\n\nUMKM Business Data:\n" . json_encode($businessData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey;

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post($url, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                ]
            ]);

            if ($response->failed()) {
                Log::error('Gemini API request failed for Business Insights', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('Failed to communicate with Gemini API: Status ' . $response->status());
            }

            $data = $response->json();
            $responseText = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

            if (!$responseText) {
                Log::error('Invalid response structure from Gemini API', ['response' => $data]);
                throw new \Exception('Invalid response structure from Gemini API');
            }

            $decoded = json_decode($responseText, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Failed to parse Gemini response as JSON for Business Insights', [
                    'raw_text' => $responseText,
                    'error' => json_last_error_msg()
                ]);
                throw new \Exception('Failed to parse Gemini response as JSON');
            }

            return [
                'business_condition' => (string) ($decoded['business_condition'] ?? $decoded['current_business_condition'] ?? ''),
                'saving_opportunity' => (string) ($decoded['saving_opportunity'] ?? $decoded['cost_saving_opportunities'] ?? ''),
                'group_buying_recommendation' => (string) ($decoded['group_buying_recommendation'] ?? ''),
                'restock_recommendation' => (string) ($decoded['restock_recommendation'] ?? ''),
                'business_advice' => (string) ($decoded['business_advice'] ?? ''),
            ];
        } catch (\Exception $e) {
            Log::error('Error occurred during Business Insight generation', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Save generated insights to database cache.
     *
     * @param User $user
     * @param array $insightData
     * @return BusinessInsight
     */
    public function saveInsight(User $user, array $insightData): BusinessInsight
    {
        return BusinessInsight::updateOrCreate(
            ['user_id' => $user->id],
            [
                'business_condition' => $insightData['business_condition'] ?? '',
                'saving_opportunity' => $insightData['saving_opportunity'] ?? '',
                'group_buying_recommendation' => $insightData['group_buying_recommendation'] ?? '',
                'restock_recommendation' => $insightData['restock_recommendation'] ?? '',
                'business_advice' => $insightData['business_advice'] ?? '',
            ]
        );
    }
}

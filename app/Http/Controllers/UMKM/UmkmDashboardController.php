<?php

namespace App\Http\Controllers\UMKM;

use App\Http\Controllers\Controller;
use App\Models\GroupBuying;
use App\Models\Order;
use App\Models\SupplierProfile;
use App\Models\User;
use App\Services\BusinessInsightService;
use App\Services\QuantityRecommendationService;
use App\Services\RestockPredictionService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class UmkmDashboardController extends Controller
{
    /**
     * Display the UMKM Dashboard.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        
        // Load UMKM Profile or create default
        $profile = $user->umkmProfile;
        if (!$profile) {
            $profile = $user->umkmProfile()->create([
                'business_name' => $user->name . ' Keripik Maju',
                'business_type' => 'Makanan',
                'business_address' => 'Malang',
                'district_city' => 'Malang',
                'raw_material_category' => 'Tepung',
                'monthly_need_estimate' => 300,
            ]);
        }

        // 1. Gather stats
        $activeGroupBuyingCount = GroupBuying::where('status', 'open')->count();
        $activeOrdersCount = Order::where('buyer_id', $user->id)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->count();
        
        // Calculated completed order savings (simulate standard 15% discount for group orders)
        $completedGroupOrdersTotal = Order::where('buyer_id', $user->id)
            ->where('status', 'completed')
            ->where('type', 'group')
            ->sum('total_price');
        $savingsVal = $completedGroupOrdersTotal > 0 ? (int) ($completedGroupOrdersTotal * 0.15) : 1250000;

        // Fetch supplier ratings to show an average
        $avgSupplierScore = SupplierProfile::avg('sirkel_score') ?? 92.00;

        $stats = [
            'active_group_buying' => $activeGroupBuyingCount,
            'active_orders' => $activeOrdersCount,
            'monthly_savings' => 'Rp ' . number_format($savingsVal, 0, ',', '.'),
            'sirkel_score' => (int) round($avgSupplierScore),
        ];

        // 2. Fetch Group Buying Campaigns
        $activeCampaigns = GroupBuying::where('status', 'open')
            ->with(['product.supplier'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($campaign) {
                // Determine distance (simulate range 1 to 15 km)
                $distanceVal = (($campaign->id * 3) % 15) + 1;
                
                // Determine saving potential (10% to 20%)
                $savingVal = 10 + (($campaign->id * 2) % 11);

                return [
                    'id' => $campaign->id,
                    'product_name' => $campaign->product->name ?? 'Product',
                    'category' => $campaign->product->category ?? 'General',
                    'target_quantity' => $campaign->target_quantity,
                    'current_quantity' => $campaign->current_quantity,
                    'min_participants' => $campaign->min_participants,
                    'participants' => $campaign->min_participants, // dynamic placeholder
                    'potential_savings' => $savingVal . '%',
                    'distance' => $distanceVal . ' km',
                    'deadline' => $campaign->deadline,
                ];
            });

        // 3. Fetch Recommended Suppliers
        $suppliers = SupplierProfile::with('user')
            ->orderBy('sirkel_score', 'desc')
            ->take(5)
            ->get()
            ->map(function ($supplier) {
                // Simulate distance and top products
                $distanceVal = (($supplier->id * 4) % 12) + 1;
                $topProducts = [
                    'Kertas' => 'Karton Box Corrugated',
                    'Tepung' => 'Tepung Terigu Segitiga',
                    'Ubi' => 'Singkong Segar Super',
                ];
                $topProduct = $topProducts[$supplier->user->umkmProfile->raw_material_category ?? 'Tepung'] ?? 'Bahan Baku Pilihan';

                return [
                    'id' => $supplier->id,
                    'supplier_name' => $supplier->supplier_name,
                    'rating' => (float) ($supplier->rating ?? 5.0),
                    'sirkel_score' => (int) ($supplier->sirkel_score ?? 90.00),
                    'distance' => $distanceVal . ' km',
                    'top_product' => $topProduct,
                    'badge' => $supplier->sirkel_score >= 90 ? 'Elite Supplier' : 'Trusted Supplier',
                ];
            });

        // 4. Fetch Recent Orders
        $recentOrders = Order::where('buyer_id', $user->id)
            ->with(['product', 'supplier'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => 'ORD-' . str_pad($order->id, 5, '0', STR_PAD_LEFT),
                    'product' => $order->product->name ?? 'Bahan Baku',
                    'supplier' => $order->supplier->supplier_name ?? 'Supplier Mitra',
                    'quantity' => $order->quantity,
                    'total_price' => (float) $order->total_price,
                    'status' => ucfirst($order->status),
                    'date' => $order->created_at->format('d M Y'),
                ];
            });

        // 5. Build AI Insights from services
        $aiInsight = [
            'business_condition' => 'Permintaan tepung stabil dan cenderung meningkat dalam 2 minggu terakhir.',
            'saving_opportunity' => 'Bergabung dengan patungan aktif dapat menghemat hingga 18% dari harga ritel.',
            'group_buying_recommendation' => 'Terdapat ' . $activeGroupBuyingCount . ' patungan aktif yang relevan di dekat lokasi Anda.',
            'restock_recommendation' => 'Stok diperkirakan habis dalam 6 hari. Rencana restock disarankan sebelum tanggal ' . now()->addDays(6)->format('d M Y') . '.',
            'business_advice' => 'Pertimbangkan pembelian kolektif untuk menekan biaya produksi dan mengoptimalkan ongkos kirim.',
        ];

        try {
            // Integrate Restock Prediction Service dynamically
            $restockService = app(RestockPredictionService::class);
            $baseline = $restockService->calculateConsumptionRate($user);
            $prediction = $restockService->predictRestockDate($user, 12, $baseline);

            $aiInsight['restock_recommendation'] = 'Stok diperkirakan habis dalam ' . $prediction['days_remaining'] . ' hari (Rencana restock: ' . Carbon::parse($prediction['estimated_restock_date'])->format('d M Y') . ').';
        } catch (\Exception $e) {
            // Fallback stays as default
        }

        try {
            // Integrate Business Insight Service dynamically if available
            $existingInsight = $user->businessInsight;
            if ($existingInsight) {
                $aiInsight['business_condition'] = $existingInsight->business_condition;
                $aiInsight['saving_opportunity'] = $existingInsight->saving_opportunity;
                $aiInsight['group_buying_recommendation'] = $existingInsight->group_buying_recommendation;
                $aiInsight['business_advice'] = $existingInsight->business_advice;
            }
        } catch (\Exception $e) {
            // Fallback stays as default
        }

        return Inertia::render('UMKM/Dashboard', [
            'profile' => [
                'business_name' => $profile->business_name,
                'business_type' => $profile->business_type,
                'raw_material_category' => $profile->raw_material_category,
                'monthly_need_estimate' => $profile->monthly_need_estimate,
            ],
            'stats' => $stats,
            'activeGroupBuying' => $activeCampaigns,
            'recommendedSuppliers' => $suppliers,
            'recentOrders' => $recentOrders,
            'aiInsight' => $aiInsight,
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ]
            ]
        ]);
    }
}

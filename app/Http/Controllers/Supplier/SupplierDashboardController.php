<?php

namespace App\Http\Controllers\Supplier;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use App\Models\SupplierProfile;
use App\Services\GeminiService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierDashboardController extends Controller
{
    /**
     * Display the supplier dashboard with products and stats.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        
        // Eager load supplier profile and its products
        $supplier = SupplierProfile::where('user_id', $user->id)->first();
        
        if (!$supplier) {
            // Fallback or auto-create supplier profile if none exists for safety
            $supplier = SupplierProfile::create([
                'user_id' => $user->id,
                'supplier_name' => $user->name . ' Supplier',
                'description' => 'Profil supplier baru.',
                'address' => 'Alamat belum diatur',
                'verified' => false,
                'rating' => 5.0,
            ]);
        }

        $products = Product::where('supplier_id', $supplier->id)
            ->orderBy('created_at', 'desc')
            ->get();

        // Calculate actual statistics
        $totalProducts = $products->count();
        $activeStock = $products->sum('stock');
        
        // Simulated / mocked orders and rating
        $totalOrders = 142; // static or dynamic placeholder
        $rating = $supplier->rating ?? 5.0;

        $stats = [
            [
                'name' => 'Total Products',
                'value' => (string) $totalProducts,
                'change' => 'Dikelola secara aktif',
                'changeType' => 'neutral'
            ],
            [
                'name' => 'Active Stock',
                'value' => number_format($activeStock) . ' pcs',
                'change' => $products->where('stock', '<=', 10)->count() . ' item stok rendah',
                'changeType' => $products->where('stock', '<=', 10)->count() > 0 ? 'warning' : 'positive'
            ],
            [
                'name' => 'Total Orders',
                'value' => (string) $totalOrders,
                'change' => '+12.4% dari bulan lalu',
                'changeType' => 'positive'
            ],
            [
                'name' => 'Rating',
                'value' => number_format($rating, 1) . ' / 5.0',
                'change' => 'Berdasarkan ulasan mitra UMKM',
                'changeType' => 'neutral'
            ],
        ];

        // Simulated group buying (Patungan) opportunities
        $groupBuying = [
            [
                'id' => 1,
                'product' => 'Bawang Putih Kating (Sirkel UMKM Kuliner)',
                'demand' => '800 kg',
                'participants' => 12,
                'revenue' => 28000000,
                'deadline' => '2 hari lagi'
            ],
            [
                'id' => 2,
                'product' => 'Cabai Rawit Merah (Sirkel Sambal Nusantara)',
                'demand' => '350 kg',
                'participants' => 8,
                'revenue' => 21000000,
                'deadline' => '5 hari lagi'
            ],
            [
                'id' => 3,
                'product' => 'Kemasan Box Corrugated (Sirkel Snack Cihanjuang)',
                'demand' => '5,000 pcs',
                'participants' => 15,
                'revenue' => 12500000,
                'deadline' => '6 jam lagi'
            ],
        ];

        // Simulated recent orders
        $recentOrders = [
            [
                'id' => 'ORD-8941',
                'customer' => 'Resto Sunda Nikmat',
                'date' => '25 Jun 2026',
                'total' => 1450000,
                'status' => 'Pending',
            ],
            [
                'id' => 'ORD-8940',
                'customer' => 'UMKM Bakso Mas Agus',
                'date' => '24 Jun 2026',
                'total' => 890000,
                'status' => 'Completed',
            ],
            [
                'id' => 'ORD-8939',
                'customer' => 'Catering Berkah',
                'date' => '24 Jun 2026',
                'total' => 4120000,
                'status' => 'Processing',
            ],
            [
                'id' => 'ORD-8938',
                'customer' => 'Warteg Kharisma',
                'date' => '23 Jun 2026',
                'total' => 345000,
                'status' => 'Completed',
            ],
        ];

        $gemini = new GeminiService();
        $aiInsight = $gemini->getSupplierRecommendation($supplier->supplier_name, $products->toArray());

        return Inertia::render('Supplier/Dashboard', [
            'supplier' => $supplier,
            'products' => $products,
            'stats' => $stats,
            'groupBuying' => $groupBuying,
            'recentOrders' => $recentOrders,
            'aiInsight' => $aiInsight,
        ]);
    }

    /**
     * Store a newly created product.
     */
    public function storeProduct(StoreProductRequest $request): RedirectResponse
    {
        $user = auth()->user();
        $supplier = $user->supplierProfile;

        if (!$supplier) {
            return back()->with('error', 'Profil supplier tidak ditemukan.');
        }

        Product::create(array_merge($request->validated(), [
            'supplier_id' => $supplier->id,
        ]));

        return back()->with('success', 'Produk berhasil ditambahkan!');
    }

    /**
     * Update the specified product.
     */
    public function updateProduct(UpdateProductRequest $request, int $id): RedirectResponse
    {
        $user = auth()->user();
        $supplier = $user->supplierProfile;

        $product = Product::findOrFail($id);

        if (!$supplier || $product->supplier_id !== $supplier->id) {
            return back()->with('error', 'Aksi tidak diizinkan.');
        }

        $product->update($request->validated());

        return back()->with('success', 'Produk berhasil diperbarui!');
    }

    /**
     * Remove the specified product.
     */
    public function destroyProduct(int $id): RedirectResponse
    {
        $user = auth()->user();
        $supplier = $user->supplierProfile;

        $product = Product::findOrFail($id);

        if (!$supplier || $product->supplier_id !== $supplier->id) {
            return back()->with('error', 'Aksi tidak diizinkan.');
        }

        $product->delete();

        return back()->with('success', 'Produk berhasil dihapus!');
    }
}

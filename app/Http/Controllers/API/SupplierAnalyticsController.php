<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SupplierAnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $supplier = $request->user()->supplierProfile;
        if (!$supplier) {
            return response()->json(['success' => false, 'message' => 'Not a supplier'], 403);
        }

        // Top 5 products by total quantity sold (Completed orders)
        $topProducts = Order::where('supplier_id', $supplier->id)
            ->where('status', 'completed')
            ->select('product_id', DB::raw('SUM(quantity) as total_sold'))
            ->groupBy('product_id')
            ->orderBy('total_sold', 'desc')
            ->take(5)
            ->with('product:id,name,image,price,category')
            ->get();

        // Monthly sales trend (last 6 months)
        $salesTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            
            $totalSales = Order::where('supplier_id', $supplier->id)
                ->where('status', 'completed')
                ->whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->sum('total_price');

            $salesTrend[] = [
                'month' => $month->translatedFormat('M Y'),
                'total' => $totalSales
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'top_products' => $topProducts,
                'sales_trend' => $salesTrend
            ]
        ]);
    }

    public function taxReport(Request $request)
    {
        $supplier = $request->user()->supplierProfile;
        // If it's a staff
        if (!$supplier && $request->user()->supplier_id) {
            $supplier = \App\Models\SupplierProfile::find($request->user()->supplier_id);
        }
        if (!$supplier) {
            return response()->json(['success' => false, 'message' => 'Not a supplier'], 403);
        }

        $orders = Order::where('supplier_id', $supplier->id)
            ->where('status', 'completed')
            ->with('invoice')
            ->get();

        $taxRate = $supplier->tax_rate ?? 11;
        $report = [];
        $totalTax = 0;

        foreach($orders as $order) {
            $tax = ($order->total_price * $taxRate) / 100;
            $totalTax += $tax;
            $report[] = [
                'order_id' => $order->id,
                'date' => $order->created_at->format('Y-m-d'),
                'amount' => $order->total_price,
                'tax' => $tax,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'tax_rate' => $taxRate,
                'npwp' => $supplier->npwp,
                'total_tax' => $totalTax,
                'transactions' => $report,
            ]
        ]);
    }
}

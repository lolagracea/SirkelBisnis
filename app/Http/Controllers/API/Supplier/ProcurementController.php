<?php

namespace App\Http\Controllers\Api\Supplier;

use App\Http\Controllers\Controller;
use App\Models\Manufacturer;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\StockLedger;
use App\Models\Product;
use Illuminate\Http\Request;

class ProcurementController extends Controller
{
    public function indexManufacturers(Request $request)
    {
        $supplierId = $request->user()->supplierProfile->id ?? $request->user()->supplier_id;
        $manufacturers = Manufacturer::where('supplier_id', $supplierId)->get();
        
        return response()->json(['status' => 'success', 'data' => $manufacturers]);
    }

    public function storeManufacturer(Request $request)
    {
        $supplierId = $request->user()->supplierProfile->id ?? $request->user()->supplier_id;
        
        $request->validate([
            'name' => 'required|string',
            'contact_info' => 'nullable|string',
            'address' => 'nullable|string',
        ]);

        $manufacturer = Manufacturer::create([
            'supplier_id' => $supplierId,
            'name' => $request->name,
            'contact_info' => $request->contact_info,
            'address' => $request->address,
        ]);

        return response()->json(['status' => 'success', 'data' => $manufacturer], 201);
    }

    public function indexPurchaseOrders(Request $request)
    {
        $supplierId = $request->user()->supplierProfile->id ?? $request->user()->supplier_id;
        $pos = PurchaseOrder::with(['manufacturer', 'items.product'])->where('supplier_id', $supplierId)->get();
        
        return response()->json(['status' => 'success', 'data' => $pos]);
    }

    public function storePurchaseOrder(Request $request)
    {
        $supplierId = $request->user()->supplierProfile->id ?? $request->user()->supplier_id;
        
        $request->validate([
            'manufacturer_id' => 'required|exists:manufacturers,id',
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $totalAmount = 0;
        foreach($request->items as $item) {
            $totalAmount += $item['quantity'] * $item['unit_price'];
        }

        $po = PurchaseOrder::create([
            'supplier_id' => $supplierId,
            'manufacturer_id' => $request->manufacturer_id,
            'status' => 'ordered',
            'total_amount' => $totalAmount,
        ]);

        foreach($request->items as $item) {
            PurchaseOrderItem::create([
                'purchase_order_id' => $po->id,
                'product_id' => $item['product_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
            ]);
        }

        return response()->json(['status' => 'success', 'data' => $po->load('items')], 201);
    }

    public function receivePurchaseOrder(Request $request, $id)
    {
        $supplierId = $request->user()->supplierProfile->id ?? $request->user()->supplier_id;
        $po = PurchaseOrder::with('items')->where('supplier_id', $supplierId)->findOrFail($id);

        if ($po->status === 'received') {
            return response()->json(['status' => 'error', 'message' => 'PO already received'], 400);
        }

        $po->update(['status' => 'received']);

        // Update Stock Ledger for each item
        foreach($po->items as $item) {
            StockLedger::create([
                'product_id' => $item->product_id,
                'type' => 'in',
                'quantity' => $item->quantity,
                'notes' => 'Received from PO #' . $po->id,
            ]);
        }

        return response()->json(['status' => 'success', 'data' => $po]);
    }
}

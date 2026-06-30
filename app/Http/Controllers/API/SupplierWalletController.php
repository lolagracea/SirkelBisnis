<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\WalletTransaction;

class SupplierWalletController extends Controller
{
    public function summary(Request $request)
    {
        $supplier = $request->user()->supplierProfile;
        if (!$supplier) {
            return response()->json(['success' => false, 'message' => 'Not a supplier'], 403);
        }

        $transactions = WalletTransaction::where('supplier_id', $supplier->id)->orderBy('created_at', 'desc')->get();
        
        $pendingBalance = \App\Models\Order::where('supplier_id', $supplier->id)
            ->whereIn('status', ['paid', 'processing', 'shipped'])
            ->sum('total_price');

        return response()->json([
            'success' => true,
            'data' => [
                'balance' => $supplier->balance,
                'pending_balance' => $pendingBalance,
                'transactions' => $transactions
            ]
        ]);
    }

    public function withdraw(Request $request)
    {
        $request->validate(['amount' => 'required|numeric|min:10000']);
        $supplier = $request->user()->supplierProfile;
        
        if (!$supplier || $supplier->balance < $request->amount) {
            return response()->json(['success' => false, 'message' => 'Saldo tidak mencukupi'], 400);
        }

        $supplier->balance -= $request->amount;
        $supplier->save();

        $transaction = WalletTransaction::create([
            'supplier_id' => $supplier->id,
            'amount' => $request->amount,
            'type' => 'withdrawal',
            'status' => 'pending',
            'description' => 'Penarikan dana ke rekening bank'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permintaan penarikan dana berhasil',
            'data' => $transaction
        ]);
    }
}

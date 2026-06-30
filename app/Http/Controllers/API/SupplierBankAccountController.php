<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\SupplierBankAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierBankAccountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $profile = $request->user()->supplierProfile;
        if (!$profile) {
            return response()->json(['success' => false, 'message' => 'Not a supplier'], 403);
        }

        $accounts = SupplierBankAccount::where('supplier_id', $profile->id)->get();
        return response()->json(['success' => true, 'data' => $accounts]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'bank_name' => 'required|string',
            'account_number' => 'required|string',
            'account_holder_name' => 'required|string',
            'is_primary' => 'boolean',
        ]);

        $profile = $request->user()->supplierProfile;
        if (!$profile) {
            return response()->json(['success' => false, 'message' => 'Not a supplier'], 403);
        }

        if ($request->input('is_primary')) {
            SupplierBankAccount::where('supplier_id', $profile->id)->update(['is_primary' => false]);
        }

        $account = SupplierBankAccount::create(array_merge($request->all(), ['supplier_id' => $profile->id]));

        return response()->json(['success' => true, 'data' => $account]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $account = SupplierBankAccount::findOrFail($id);
        $profile = $request->user()->supplierProfile;
        if (!$profile || $account->supplier_id !== $profile->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        if ($request->input('is_primary')) {
            SupplierBankAccount::where('supplier_id', $profile->id)->update(['is_primary' => false]);
        }

        $account->update($request->all());

        return response()->json(['success' => true, 'data' => $account]);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $account = SupplierBankAccount::findOrFail($id);
        $profile = $request->user()->supplierProfile;
        if (!$profile || $account->supplier_id !== $profile->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $account->delete();
        return response()->json(['success' => true, 'message' => 'Deleted successfully']);
    }
}

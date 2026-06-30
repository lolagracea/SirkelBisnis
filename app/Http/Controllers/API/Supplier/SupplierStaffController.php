<?php

namespace App\Http\Controllers\Api\Supplier;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class SupplierStaffController extends Controller
{
    public function index(Request $request)
    {
        $supplierId = $request->user()->supplierProfile->id ?? $request->user()->supplier_id;

        $staffs = User::where('supplier_id', $supplierId)->get();

        return response()->json([
            'status' => 'success',
            'data' => $staffs
        ]);
    }

    public function store(Request $request)
    {
        $supplierId = $request->user()->supplierProfile->id ?? $request->user()->supplier_id;

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'supplier_role' => 'required|string|in:admin,finance,warehouse',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $staff = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'supplier_staff',
            'supplier_id' => $supplierId,
            'supplier_role' => $request->supplier_role,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Staff created successfully',
            'data' => $staff
        ], 201);
    }

    public function destroy(Request $request, $id)
    {
        $supplierId = $request->user()->supplierProfile->id ?? $request->user()->supplier_id;
        $staff = User::where('supplier_id', $supplierId)->findOrFail($id);
        
        $staff->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Staff deleted successfully'
        ]);
    }
}

<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterAdminRequest;
use App\Http\Requests\Auth\RegisterSupplierRequest;
use App\Http\Requests\Auth\RegisterUmkmRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RegisterController extends Controller
{
    public function registerUmkm(RegisterUmkmRequest $request): RedirectResponse
    {
        $user = DB::transaction(function () use ($request): User {
            $user = User::create([
                'name' => $request->name,
                'nik' => $request->nik,
                'phone_number' => $request->phone_number,
                'role' => 'umkm',
                'account_status' => 'active',
                'password' => $request->password,
            ]);

            $user->umkmProfile()->create($request->safe()->only([
                'business_name',
                'business_type',
                'business_address',
                'district_city',
                'raw_material_category',
                'monthly_need_estimate',
            ]));

            $user->assignRole('umkm');

            return $user;
        });

        Auth::login($user);

        return redirect()->route('umkm.dashboard');
    }

    public function registerSupplier(RegisterSupplierRequest $request): RedirectResponse
    {
        $user = DB::transaction(function () use ($request): User {
            $user = User::create([
                'name' => $request->name,
                'nik' => $request->nik,
                'phone_number' => $request->phone_number,
                'role' => 'supplier',
                'account_status' => 'pending',
                'password' => $request->password,
            ]);

            $user->supplierProfile()->create($request->safe()->only([
                'store_name',
                'warehouse_address',
                'product_category',
                'price',
                'stock',
                'minimum_order',
                'delivery_area',
                'business_tax_number',
            ]));

            $user->assignRole('supplier');

            return $user;
        });

        Auth::login($user);

        return redirect()->route('supplier.dashboard');
    }

    public function registerAdmin(RegisterAdminRequest $request): RedirectResponse
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'role' => 'admin',
            'admin_role' => $request->admin_role,
            'permissions' => $request->permissions,
            'account_status' => $request->account_status,
            'password' => $request->password,
        ]);

        $user->assignRole('admin');

        Auth::login($user);

        return redirect()->route('admin.dashboard');
    }
}

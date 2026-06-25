<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterUmkmRequest;
use App\Http\Requests\Auth\RegisterSupplierRequest;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Handle API login.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $login = $request->string('login')->toString();
        $column = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'phone_number';

        $user = User::where($column, $login)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email/nomor HP atau password tidak sesuai.'
            ], 401);
        }

        if ($user->account_status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Akun belum aktif atau sedang dinonaktifkan.'
            ], 403);
        }

        // Generate Sanctum token
        $token = $user->createToken('auth_token')->plainTextToken;

        // Log login activity
        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'login_api',
            'description' => 'User berhasil login melalui API.',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone_number' => $user->phone_number,
                'role' => $user->role,
                'profile' => $user->role === 'umkm' ? $user->umkmProfile : ($user->role === 'supplier' ? $user->supplierProfile : null)
            ]
        ]);
    }

    /**
     * Handle UMKM registration.
     */
    public function registerUmkm(RegisterUmkmRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request): User {
            $user = User::create([
                'name' => $request->name,
                'nik' => $request->nik,
                'phone_number' => $request->phone_number,
                'role' => 'umkm',
                'account_status' => 'active',
                'password' => Hash::make($request->password),
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

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran UMKM berhasil.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone_number' => $user->phone_number,
                'role' => $user->role,
                'profile' => $user->umkmProfile
            ]
        ], 201);
    }

    /**
     * Handle Supplier registration.
     */
    public function registerSupplier(RegisterSupplierRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request): User {
            $user = User::create([
                'name' => $request->name,
                'nik' => $request->nik,
                'phone_number' => $request->phone_number,
                'role' => 'supplier',
                'account_status' => 'active',
                'password' => Hash::make($request->password),
            ]);

            $user->supplierProfile()->create($request->safe()->only([
                'supplier_name',
                'address',
                'description',
                'latitude',
                'longitude',
            ]));

            $user->assignRole('supplier');

            return $user;
        });

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran Supplier berhasil.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone_number' => $user->phone_number,
                'role' => $user->role,
                'profile' => $user->supplierProfile
            ]
        ], 201);
    }

    /**
     * Handle API logout.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.'
        ]);
    }
}

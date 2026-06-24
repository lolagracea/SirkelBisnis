<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    public function login(LoginRequest $request): RedirectResponse
    {
        $login = $request->string('login')->toString();
        $column = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'phone_number';

        $user = User::where($column, $login)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => 'Email/nomor HP atau password tidak sesuai.',
            ]);
        }

        if ($user->account_status !== 'active') {
            throw ValidationException::withMessages([
                'login' => 'Akun belum aktif atau sedang dinonaktifkan.',
            ]);
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        $user->forceFill(['last_login_at' => now()])->save();

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'login',
            'description' => 'User berhasil login.',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return redirect()->intended($this->redirectPath($user));
    }

    public function logout(): RedirectResponse
    {
        Auth::logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();

        return redirect('/');
    }

    private function redirectPath(User $user): string
    {
        return match ($user->role) {
            'umkm' => route('umkm.dashboard'),
            'supplier' => route('supplier.dashboard'),
            'admin' => route('admin.dashboard'),
            default => '/',
        };
    }
}

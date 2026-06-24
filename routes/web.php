<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::middleware('guest')->group(function () {
    Route::view('/login', 'auth.login')->name('login.form');
    Route::view('/register', 'auth.register')->name('register.form');
    Route::post('/register/umkm', [RegisterController::class, 'registerUmkm'])->name('register.umkm');
    Route::post('/register/supplier', [RegisterController::class, 'registerSupplier'])->name('register.supplier');
    Route::post('/register/admin', [RegisterController::class, 'registerAdmin'])->name('register.admin');
    Route::post('/login', [LoginController::class, 'login'])->name('login');
});

Route::post('/logout', [LoginController::class, 'logout'])->middleware('auth')->name('logout');

Route::middleware(['auth', 'role:umkm'])->get('/umkm/dashboard', function () {
    return 'Dashboard UMKM/Pembeli';
})->name('umkm.dashboard');

Route::middleware(['auth', 'role:supplier'])->get('/supplier/dashboard', function () {
    return 'Dashboard Supplier';
})->name('supplier.dashboard');

Route::middleware(['auth', 'role:admin'])->get('/admin/dashboard', function () {
    return 'Dashboard Admin';
})->name('admin.dashboard');

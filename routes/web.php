<?php

use Illuminate\Support\Facades\Route;

// Named routes for backward compatibility
Route::view('/login', 'app')->name('login.form');
Route::view('/register', 'app')->name('register.form');

// Wildcard routing to serve the React SPA
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api|up).*$')->name('spa');


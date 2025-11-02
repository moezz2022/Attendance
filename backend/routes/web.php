<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', function () {
    return response()->json([
        'message' => 'هذا API فقط. استخدم /api/login للتسجيل'
    ], 200);
})->name('login');
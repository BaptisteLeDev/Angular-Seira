<?php

use App\Http\Controllers\AggregateController;
use App\Http\Controllers\UserSchoolController;
use App\Http\Controllers\WatchSessionController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('watch-sessions')->group(function () {
    Route::post('/request',   [WatchSessionController::class, 'request']);
    Route::post('/heartbeat', [WatchSessionController::class, 'heartbeat']);
});

Route::middleware('auth:sanctum')->prefix('aggregates')->group(function () {
    Route::get('/teacher', [AggregateController::class, 'teacher']);
    Route::get('/school',  [AggregateController::class, 'school']);
});

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/users/{id}/schools',              [UserSchoolController::class, 'index']);
    Route::post('/users/{id}/schools',             [UserSchoolController::class, 'assign']);
    Route::delete('/users/{id}/schools/{schoolId}', [UserSchoolController::class, 'remove']);
});

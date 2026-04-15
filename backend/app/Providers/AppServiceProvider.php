<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::define('users.list', fn (User $user): bool => $user->isAdmin());

        Gate::define('users.view', function (User $user, mixed $subject): bool {
            return $user->isAdmin() || ($subject instanceof User && $subject->id === $user->id);
        });

        Gate::define('users.create', fn (User $user): bool => $user->isAdmin());
        Gate::define('users.update', fn (User $user, mixed $subject): bool => $user->isAdmin() && $subject instanceof User);
        Gate::define('users.delete', fn (User $user, mixed $subject): bool => $user->isAdmin() && $subject instanceof User);
    }
}

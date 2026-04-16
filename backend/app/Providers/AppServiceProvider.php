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

        Gate::define('schools.list', fn (User $user): bool => $user->isAdmin());
        Gate::define('schools.view', fn (User $user): bool => $user->isAdmin());
        Gate::define('schools.create', fn (User $user): bool => $user->isAdmin());
        Gate::define('schools.update', fn (User $user): bool => $user->isAdmin());
        Gate::define('schools.delete', fn (User $user): bool => $user->isAdmin());

        Gate::define('classrooms.list', fn (User $user): bool => $user->isAdmin());
        Gate::define('classrooms.view', fn (User $user): bool => $user->isAdmin());
        Gate::define('classrooms.create', fn (User $user): bool => $user->isAdmin());
        Gate::define('classrooms.update', fn (User $user): bool => $user->isAdmin());
        Gate::define('classrooms.delete', fn (User $user): bool => $user->isAdmin());

        Gate::define('subjects.list', fn (User $user): bool => $user->isAdmin());
        Gate::define('subjects.view', fn (User $user): bool => $user->isAdmin());
        Gate::define('subjects.create', fn (User $user): bool => $user->isAdmin());
        Gate::define('subjects.update', fn (User $user): bool => $user->isAdmin());
        Gate::define('subjects.delete', fn (User $user): bool => $user->isAdmin());

        Gate::define('chapters.list', fn (User $user): bool => $user->isAdmin());
        Gate::define('chapters.view', fn (User $user): bool => $user->isAdmin());
        Gate::define('chapters.create', fn (User $user): bool => $user->isAdmin());
        Gate::define('chapters.update', fn (User $user): bool => $user->isAdmin());
        Gate::define('chapters.delete', fn (User $user): bool => $user->isAdmin());

        Gate::define('chapter_contents.list', fn (User $user, mixed $subject = null): bool => $user->exists);
        Gate::define('chapter_contents.view', fn (User $user, mixed $subject = null): bool => $user->exists);
        Gate::define('chapter_contents.create', fn (User $user, mixed $subject = null): bool => $user->isAdmin());
        Gate::define('chapter_contents.update', fn (User $user, mixed $subject = null): bool => $user->isAdmin());
        Gate::define('chapter_contents.delete', fn (User $user, mixed $subject = null): bool => $user->isAdmin());

        Gate::define('videos.list', fn (User $user, mixed $subject = null): bool => $user->exists);
        Gate::define('videos.view', fn (User $user, mixed $subject = null): bool => $user->exists);
        Gate::define('videos.create', fn (User $user, mixed $subject = null): bool => $user->isAdmin());
        Gate::define('videos.update', fn (User $user, mixed $subject = null): bool => $user->isAdmin());
        Gate::define('videos.delete', fn (User $user, mixed $subject = null): bool => $user->isAdmin());

        Gate::define('video_progress.list', fn (User $user, mixed $subject = null): bool => $user->exists);
        Gate::define('video_progress.view', fn (User $user, mixed $subject = null): bool => $user->exists);
        Gate::define('video_progress.create', fn (User $user, mixed $subject = null): bool => $user->exists);
        Gate::define('video_progress.update', fn (User $user, mixed $subject = null): bool => $user->exists);
        Gate::define('video_progress.delete', fn (User $user, mixed $subject = null): bool => $user->exists);
    }
}

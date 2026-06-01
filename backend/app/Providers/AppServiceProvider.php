<?php

namespace App\Providers;

use App\Models\Chapter;
use App\Models\ChapterContent;
use App\Models\ChapterProgress;
use App\Models\Classroom;
use App\Models\Subject;
use App\Models\User;
use App\Models\Video;
use App\Models\VideoProgress;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

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
        Gate::define('classrooms.view', function (User $user, mixed $subject): bool {
            if ($user->isAdmin()) return true;
            if (!$subject instanceof Classroom) return false;

            if ($user->role === User::ROLE_STUDENT) {
                return $user->classroom_id === $subject->id;
            }

            if ($user->role === User::ROLE_TEACHER) {
                return $subject->subjects()->where('teacher_id', $user->id)->exists();
            }

            return false;
        });
        Gate::define('classrooms.create', fn (User $user): bool => $user->isAdmin());
        Gate::define('classrooms.update', fn (User $user): bool => $user->isAdmin());
        Gate::define('classrooms.delete', fn (User $user): bool => $user->isAdmin());

        Gate::define('subjects.list', fn (User $user): bool => $user->isAdmin() || $user->role === User::ROLE_TEACHER);
        Gate::define('subjects.view', function (User $user, mixed $subject): bool {
            if ($user->isAdmin()) return true;
            if (!$subject instanceof Subject) return false;

            if ($user->role === User::ROLE_TEACHER) {
                return $subject->teacher_id === $user->id;
            }

            if ($user->role === User::ROLE_STUDENT) {
                if ($user->classroom_id === null) return false;
                return $subject->classrooms()
                    ->where('classrooms.id', $user->classroom_id)
                    ->exists();
            }

            return false;
        });
        Gate::define('subjects.create', fn (User $user): bool => $user->isAdmin());
        Gate::define('subjects.update', fn (User $user): bool => $user->isAdmin());
        Gate::define('subjects.delete', fn (User $user): bool => $user->isAdmin());

        Gate::define('chapters.list', fn (User $user): bool => $user->isAdmin());
        Gate::define('chapters.view', function (User $user, mixed $subject): bool {
            if ($user->isAdmin()) return true;
            if (!$subject instanceof Chapter) return false;

            if ($user->role === User::ROLE_TEACHER) {
                return Subject::query()
                    ->where('id', $subject->subject_id)
                    ->where('teacher_id', $user->id)
                    ->exists();
            }

            if ($user->role === User::ROLE_STUDENT) {
                if ($user->classroom_id === null) return false;
                return Subject::query()
                    ->where('id', $subject->subject_id)
                    ->whereHas('classrooms', fn ($q) => $q->where('classrooms.id', $user->classroom_id))
                    ->exists();
            }

            return false;
        });
        Gate::define('chapters.create', fn (User $user): bool => $user->isAdmin());
        Gate::define('chapters.update', fn (User $user): bool => $user->isAdmin());
        Gate::define('chapters.delete', fn (User $user): bool => $user->isAdmin());

        Gate::define('chapter_contents.list', fn (User $user): bool => $user->exists);
        Gate::define('chapter_contents.view', function (User $user, mixed $subject = null): bool {
            if ($user->isAdmin()) return true;
            if (!$subject instanceof ChapterContent) return false;

            $chapter = Chapter::find($subject->chapter_id);
            if ($chapter === null) return false;

            if ($user->role === User::ROLE_TEACHER) {
                return Subject::query()
                    ->where('id', $chapter->subject_id)
                    ->where('teacher_id', $user->id)
                    ->exists();
            }

            if ($user->role === User::ROLE_STUDENT) {
                if ($user->classroom_id === null) return false;
                return Subject::query()
                    ->where('id', $chapter->subject_id)
                    ->whereHas('classrooms', fn ($q) => $q->where('classrooms.id', $user->classroom_id))
                    ->exists();
            }

            return false;
        });
        Gate::define('chapter_contents.create', fn (User $user): bool => $user->isAdmin());
        Gate::define('chapter_contents.update', fn (User $user): bool => $user->isAdmin());
        Gate::define('chapter_contents.delete', fn (User $user): bool => $user->isAdmin());

        Gate::define('videos.list', fn (User $user): bool => $user->exists);
        Gate::define('videos.view', function (User $user, mixed $subject = null): bool {
            if ($user->isAdmin()) return true;
            if (!$subject instanceof Video) return false;

            $chapter = Chapter::find($subject->chapter_id);
            if ($chapter === null) return false;

            if ($user->role === User::ROLE_TEACHER) {
                return Subject::query()
                    ->where('id', $chapter->subject_id)
                    ->where('teacher_id', $user->id)
                    ->exists();
            }

            if ($user->role === User::ROLE_STUDENT) {
                if ($user->classroom_id === null) return false;
                return Subject::query()
                    ->where('id', $chapter->subject_id)
                    ->whereHas('classrooms', fn ($q) => $q->where('classrooms.id', $user->classroom_id))
                    ->exists();
            }

            return false;
        });
        Gate::define('videos.create', fn (User $user): bool => $user->isAdmin());
        Gate::define('videos.update', fn (User $user): bool => $user->isAdmin());
        Gate::define('videos.delete', fn (User $user): bool => $user->isAdmin());

        Gate::define('video_progress.list', fn (User $user): bool => $user->exists);
        Gate::define('video_progress.view', function (User $user, mixed $subject = null): bool {
            if ($user->isAdmin()) return true;
            if (!$subject instanceof VideoProgress) return false;
            return $subject->user_id === $user->id;
        });
        Gate::define('video_progress.create', fn (User $user): bool => $user->exists);
        Gate::define('video_progress.update', function (User $user, mixed $subject = null): bool {
            if ($user->isAdmin()) return true;
            if (!$subject instanceof VideoProgress) return false;
            return $subject->user_id === $user->id;
        });
        Gate::define('video_progress.delete', function (User $user, mixed $subject = null): bool {
            if ($user->isAdmin()) return true;
            if (!$subject instanceof VideoProgress) return false;
            return $subject->user_id === $user->id;
        });

        Gate::define('chapter_progress.list', fn (User $user): bool => $user->exists);
        Gate::define('chapter_progress.view', function (User $user, mixed $subject = null): bool {
            if ($user->isAdmin()) return true;
            if (!$subject instanceof ChapterProgress) return false;
            return $subject->user_id === $user->id;
        });
        Gate::define('chapter_progress.create', fn (User $user): bool => $user->exists);
        Gate::define('chapter_progress.update', function (User $user, mixed $subject = null): bool {
            if ($user->isAdmin()) return true;
            if (!$subject instanceof ChapterProgress) return false;
            return $subject->user_id === $user->id;
        });
        Gate::define('chapter_progress.delete', function (User $user, mixed $subject = null): bool {
            if ($user->isAdmin()) return true;
            if (!$subject instanceof ChapterProgress) return false;
            return $subject->user_id === $user->id;
        });
    }
}

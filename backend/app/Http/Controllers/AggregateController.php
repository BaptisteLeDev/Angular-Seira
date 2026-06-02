<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Subject;
use App\Models\User;
use App\Models\VideoProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AggregateController extends Controller
{
    // -------------------------------------------------------------------------
    // GET /api/aggregates/teacher
    // Progression des élèves par matière pour le formateur connecté.
    // Accessible aussi aux admins (avec un paramètre ?teacher_id=X optionnel).
    // -------------------------------------------------------------------------

    public function teacher(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === User::ROLE_STUDENT) {
            return response()->json(['error' => 'Accès réservé aux formateurs et administrateurs.'], 403);
        }

        // Admin peut consulter n'importe quel formateur via ?teacher_id=
        $teacherId = $user->isAdmin()
            ? ($request->integer('teacher_id') ?: null)
            : $user->id;

        $subjectsQuery = Subject::with([
            'classrooms.students' => fn ($q) => $q->where('role', User::ROLE_STUDENT)->orderBy('last_name'),
            'chapters.videos',
        ]);

        if ($teacherId !== null) {
            $subjectsQuery->where('teacher_id', $teacherId);
        } else {
            // Admin sans filtre → toutes les matières de son école
            $subjectsQuery->where('school_id', $user->school_id);
        }

        $subjects = $subjectsQuery->get();

        // Pré-charger tous les VideoProgress concernés en une seule requête
        $allVideoIds = $subjects
            ->flatMap(fn ($s) => $s->chapters->flatMap(fn ($c) => $c->videos->pluck('id')))
            ->unique()
            ->values();

        $progressByUserVideo = VideoProgress::whereIn('video_id', $allVideoIds)
            ->get()
            ->keyBy(fn ($p) => $p->user_id . '_' . $p->video_id);

        $result = $subjects->map(function (Subject $subject) use ($progressByUserVideo) {
            $videoIdsBySubject = $subject->chapters
                ->flatMap(fn ($c) => $c->videos->pluck('id'))
                ->all();

            $totalVideos       = count($videoIdsBySubject);
            $totalDuration     = $subject->chapters
                ->flatMap(fn ($c) => $c->videos->pluck('duration_seconds'))
                ->sum();

            $classrooms = $subject->classrooms->map(function (Classroom $classroom) use (
                $progressByUserVideo, $videoIdsBySubject, $totalVideos, $totalDuration
            ) {
                $students = $classroom->students->map(fn (User $student) => $this->buildStudentStats(
                    $student,
                    $videoIdsBySubject,
                    $totalVideos,
                    $totalDuration,
                    $progressByUserVideo
                ));

                return [
                    'id'       => $classroom->id,
                    'name'     => $classroom->name,
                    'level'    => $classroom->level,
                    'students' => $students->values(),
                ];
            });

            return [
                'id'           => $subject->id,
                'name'         => $subject->name,
                'totalVideos'  => $totalVideos,
                'totalSeconds' => $totalDuration,
                'classrooms'   => $classrooms->values(),
            ];
        });

        return response()->json($result->values());
    }

    // -------------------------------------------------------------------------
    // GET /api/aggregates/school
    // Vue globale par classe pour l'administrateur.
    // -------------------------------------------------------------------------

    public function school(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json(['error' => 'Accès réservé aux administrateurs.'], 403);
        }

        $classrooms = Classroom::with([
            'students'         => fn ($q) => $q->where('role', User::ROLE_STUDENT)->orderBy('last_name'),
            'subjects.chapters.videos',
        ])
            ->where('school_id', $user->school_id)
            ->get();

        // Pré-charger tous les VideoProgress en une seule requête
        $allVideoIds = $classrooms
            ->flatMap(fn ($cl) => $cl->subjects->flatMap(
                fn ($s) => $s->chapters->flatMap(fn ($c) => $c->videos->pluck('id'))
            ))
            ->unique()
            ->values();

        $progressByUserVideo = VideoProgress::whereIn('video_id', $allVideoIds)
            ->get()
            ->keyBy(fn ($p) => $p->user_id . '_' . $p->video_id);

        $result = $classrooms->map(function (Classroom $classroom) use ($progressByUserVideo) {
            $students = $classroom->students->map(function (User $student) use (
                $classroom, $progressByUserVideo
            ) {
                $subjectStats = $classroom->subjects->map(function (Subject $subject) use (
                    $student, $progressByUserVideo
                ) {
                    $videoIds      = $subject->chapters
                        ->flatMap(fn ($c) => $c->videos->pluck('id'))
                        ->all();
                    $totalVideos   = count($videoIds);
                    $totalDuration = $subject->chapters
                        ->flatMap(fn ($c) => $c->videos->pluck('duration_seconds'))
                        ->sum();

                    $stats = $this->buildStudentStats(
                        $student,
                        $videoIds,
                        $totalVideos,
                        $totalDuration,
                        $progressByUserVideo
                    );

                    return [
                        'subjectId'   => $subject->id,
                        'subjectName' => $subject->name,
                        ...$stats['progress'],
                    ];
                });

                return [
                    'id'        => $student->id,
                    'firstName' => $student->first_name,
                    'lastName'  => $student->last_name,
                    'email'     => $student->email,
                    'subjects'  => $subjectStats->values(),
                ];
            });

            return [
                'id'       => $classroom->id,
                'name'     => $classroom->name,
                'level'    => $classroom->level,
                'students' => $students->values(),
            ];
        });

        return response()->json($result->values());
    }

    // -------------------------------------------------------------------------
    // Helper
    // -------------------------------------------------------------------------

    /**
     * Calcule les statistiques de progression d'un élève pour un ensemble de vidéos.
     *
     * @param  array<int>                               $videoIds
     * @param  \Illuminate\Support\Collection<string, VideoProgress>  $progressByUserVideo
     * @return array<string, mixed>
     */
    private function buildStudentStats(
        User $student,
        array $videoIds,
        int $totalVideos,
        int $totalDuration,
        $progressByUserVideo
    ): array {
        $completed   = 0;
        $inProgress  = 0;
        $watchedSec  = 0;

        foreach ($videoIds as $videoId) {
            $key      = $student->id . '_' . $videoId;
            $progress = $progressByUserVideo->get($key);

            if ($progress === null) {
                continue;
            }

            $watchedSec += $progress->watched_seconds_validated;

            match ($progress->status) {
                'completed'   => $completed++,
                'in_progress' => $inProgress++,
                default       => null,
            };
        }

        $completionPercent = $totalDuration > 0
            ? round(($watchedSec / $totalDuration) * 100, 1)
            : 0.0;

        return [
            'id'        => $student->id,
            'firstName' => $student->first_name,
            'lastName'  => $student->last_name,
            'email'     => $student->email,
            'progress'  => [
                'totalVideos'        => $totalVideos,
                'completedVideos'    => $completed,
                'inProgressVideos'   => $inProgress,
                'notStartedVideos'   => $totalVideos - $completed - $inProgress,
                'watchedSeconds'     => $watchedSec,
                'totalSeconds'       => $totalDuration,
                'completionPercent'  => $completionPercent,
            ],
        ];
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Subject;
use App\Models\User;
use App\Models\VideoProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class AggregateController extends Controller
{
    public function teacher(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === User::ROLE_STUDENT) {
            abort(403, 'Accès réservé aux formateurs et administrateurs.');
        }

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
            $subjectsQuery->where('school_id', $user->school_id);
        }

        $subjects = $subjectsQuery->get();

        $allVideoIds = $subjects
            ->flatMap(fn ($s) => $s->chapters->flatMap(fn ($c) => $c->videos->pluck('id')))
            ->unique()
            ->values();

        $progressByUserVideo = VideoProgress::whereIn('video_id', $allVideoIds)
            ->get()
            ->keyBy(fn ($p) => $p->user_id . '_' . $p->video_id);

        $result = $subjects->map(function (Subject $subject) use ($progressByUserVideo) {
            $videoIds      = [];
            $totalDuration = 0;
            foreach ($subject->chapters as $chapter) {
                foreach ($chapter->videos as $video) {
                    $videoIds[]     = $video->id;
                    $totalDuration += $video->duration_seconds;
                }
            }

            $classrooms = $subject->classrooms->map(fn (Classroom $classroom) => [
                'id'       => $classroom->id,
                'name'     => $classroom->name,
                'level'    => $classroom->level,
                'students' => $classroom->students
                    ->map(fn (User $student) => $this->buildStudentStats(
                        $student, $videoIds, count($videoIds), $totalDuration, $progressByUserVideo
                    ))
                    ->values(),
            ]);

            return [
                'id'           => $subject->id,
                'name'         => $subject->name,
                'totalVideos'  => count($videoIds),
                'totalSeconds' => $totalDuration,
                'classrooms'   => $classrooms->values(),
            ];
        });

        return response()->json($result->values());
    }

    public function school(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            abort(403, 'Accès réservé aux administrateurs.');
        }

        $classrooms = Classroom::with([
            'students'         => fn ($q) => $q->where('role', User::ROLE_STUDENT)->orderBy('last_name'),
            'subjects.chapters.videos',
        ])
            ->where('school_id', $user->school_id)
            ->get();

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
            $subjectMeta = [];
            foreach ($classroom->subjects as $subject) {
                $videoIds      = [];
                $totalDuration = 0;
                foreach ($subject->chapters as $chapter) {
                    foreach ($chapter->videos as $video) {
                        $videoIds[]     = $video->id;
                        $totalDuration += $video->duration_seconds;
                    }
                }
                $subjectMeta[$subject->id] = [$videoIds, count($videoIds), $totalDuration];
            }

            $students = $classroom->students->map(function (User $student) use (
                $classroom, $progressByUserVideo, $subjectMeta
            ) {
                $subjectStats = $classroom->subjects->map(function (Subject $subject) use (
                    $student, $progressByUserVideo, $subjectMeta
                ) {
                    [$videoIds, $totalVideos, $totalDuration] = $subjectMeta[$subject->id];

                    $stats = $this->buildStudentStats(
                        $student, $videoIds, $totalVideos, $totalDuration, $progressByUserVideo
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

    /**
     * @param  array<int>      $videoIds
     * @param  Collection<string, VideoProgress>  $progressByUserVideo
     * @return array<string, mixed>
     */
    private function buildStudentStats(
        User $student,
        array $videoIds,
        int $totalVideos,
        int $totalDuration,
        Collection $progressByUserVideo
    ): array {
        $completed  = 0;
        $inProgress = 0;
        $watchedSec = 0;

        foreach ($videoIds as $videoId) {
            $progress = $progressByUserVideo->get($student->id . '_' . $videoId);

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
                'totalVideos'       => $totalVideos,
                'completedVideos'   => $completed,
                'inProgressVideos'  => $inProgress,
                'notStartedVideos'  => $totalVideos - $completed - $inProgress,
                'watchedSeconds'    => $watchedSec,
                'totalSeconds'      => $totalDuration,
                'completionPercent' => $completionPercent,
            ],
        ];
    }
}

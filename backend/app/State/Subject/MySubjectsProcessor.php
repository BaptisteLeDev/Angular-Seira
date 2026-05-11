<?php

namespace App\State\Subject;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * @implements ProcessorInterface<mixed, JsonResponse>
 */
class MySubjectsProcessor implements ProcessorInterface
{
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): JsonResponse
    {
        $request = $context['request'] ?? null;
        if (!$request instanceof Request || !$request->user()) {
            return new JsonResponse(null, 401);
        }

        return new JsonResponse($this->resolveSubjects($request->user()));
    }

    private function resolveSubjects(User $user): array
    {
        return match ($user->role) {
            User::ROLE_ADMIN   => $this->forAdmin($user),
            User::ROLE_TEACHER => $this->forTeacher($user),
            default            => $this->forStudent($user),
        };
    }

    private function forAdmin(User $user): array
    {
        $subjects = Subject::query()->where('school_id', $user->school_id)->get();

        return [
            'available' => $subjects->map(fn ($s) => $this->formatSubject($s))->values()->all(),
            'locked'    => [],
        ];
    }

    private function forTeacher(User $user): array
    {
        $subjects = Subject::query()->where('teacher_id', $user->id)->get();

        return [
            'available' => $subjects->map(fn ($s) => $this->formatSubject($s))->values()->all(),
            'locked'    => [],
        ];
    }

    private function forStudent(User $user): array
    {
        if ($user->classroom_id === null) {
            return ['available' => [], 'locked' => []];
        }

        $available = Subject::query()
            ->where('school_id', $user->school_id)
            ->whereHas('classrooms', fn ($q) => $q->where('classrooms.id', $user->classroom_id))
            ->get();

        $locked = Subject::query()
            ->where('school_id', $user->school_id)
            ->whereNotIn('id', $available->pluck('id'))
            ->get();

        return [
            'available' => $available->map(fn ($s) => $this->formatSubject($s))->values()->all(),
            'locked'    => $locked->map(fn ($s) => $this->formatSubject($s))->values()->all(),
        ];
    }

    private function formatSubject(Subject $subject): array
    {
        return [
            'id'            => (int) $subject->id,
            'name'          => (string) $subject->name,
            'description'   => $subject->description,
            'expectedHours' => (int) $subject->expected_hours,
        ];
    }
}

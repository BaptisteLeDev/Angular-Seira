<?php

namespace App\State\Subject;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\ApiResource\SubjectCreateInput;
use App\Models\Subject;
use App\Models\User;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * @implements ProcessorInterface<SubjectCreateInput, Subject>
 */
class SubjectCreateProcessor implements ProcessorInterface
{
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Subject
    {
        if (!$data instanceof SubjectCreateInput) {
            throw new UnprocessableEntityHttpException('Invalid subject payload.');
        }

        $schoolId = $data->schoolId
            ?? $data->school_id
            ?? (request()->integer('school_id') ?: request()->integer('schoolId'));

        $teacherId = $data->teacherId
            ?? $data->teacher_id
            ?? (request()->integer('teacher_id') ?: request()->integer('teacherId'));

        if ($schoolId <= 0) {
            throw new UnprocessableEntityHttpException('school_id is required.');
        }

        if ($teacherId <= 0) {
            throw new UnprocessableEntityHttpException('teacher_id is required.');
        }

        if (!User::query()->whereKey($teacherId)->exists()) {
            throw new UnprocessableEntityHttpException('Teacher not found.');
        }

        if (Subject::query()->where('school_id', $schoolId)->where('name', $data->name)->exists()) {
            throw new ConflictHttpException('Name already exists for this school.');
        }

        return Subject::query()->create([
            'school_id' => $schoolId,
            'teacher_id' => $teacherId,
            'name' => $data->name,
            'description' => $data->description,
            'referential_file_path' => $data->referential_file_path,
            'expected_hours' => $data->expected_hours,
        ]);
    }
}

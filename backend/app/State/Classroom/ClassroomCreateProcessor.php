<?php

namespace App\State\Classroom;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\ApiResource\ClassroomCreateInput;
use App\Models\Classroom;
use App\Models\School;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * @implements ProcessorInterface<ClassroomCreateInput, Classroom>
 */
class ClassroomCreateProcessor implements ProcessorInterface
{
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Classroom
    {
        if (!$data instanceof ClassroomCreateInput) {
            throw new UnprocessableEntityHttpException('Invalid classroom payload.');
        }

        $schoolId = $data->schoolId
            ?? $data->school_id
            ?? (request()->integer('school_id') ?: request()->integer('schoolId'));

        if ($schoolId <= 0) {
            throw new UnprocessableEntityHttpException('school_id is required.');
        }

        if (!School::query()->whereKey($schoolId)->exists()) {
            throw new UnprocessableEntityHttpException('School not found.');
        }

        if (Classroom::query()->where('school_id', $schoolId)->where('slug', $data->slug)->exists()) {
            throw new ConflictHttpException('Slug already exists for this school.');
        }

        return Classroom::query()->create([
            'school_id' => $schoolId,
            'level' => $data->level,
            'name' => $data->name,
            'slug' => $data->slug,
        ]);
    }
}

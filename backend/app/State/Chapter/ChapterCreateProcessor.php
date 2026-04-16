<?php

namespace App\State\Chapter;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\ApiResource\ChapterCreateInput;
use App\Models\Chapter;
use App\Models\Subject;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * @implements ProcessorInterface<ChapterCreateInput, Chapter>
 */
class ChapterCreateProcessor implements ProcessorInterface
{
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Chapter
    {
        if (!$data instanceof ChapterCreateInput) {
            throw new UnprocessableEntityHttpException('Invalid chapter payload.');
        }

        $subjectId = $data->subjectId
            ?? $data->subject_id
            ?? (request()->integer('subject_id') ?: request()->integer('subjectId'));

        if ($subjectId <= 0) {
            throw new UnprocessableEntityHttpException('subject_id is required.');
        }

        if (!Subject::query()->whereKey($subjectId)->exists()) {
            throw new UnprocessableEntityHttpException('Subject not found.');
        }

        if (Chapter::query()->where('subject_id', $subjectId)->where('sort_order', $data->sort_order)->exists()) {
            throw new ConflictHttpException('Sort order already exists for this subject.');
        }

        return Chapter::query()->create([
            'subject_id' => $subjectId,
            'title' => $data->title,
            'sort_order' => $data->sort_order,
        ]);
    }
}

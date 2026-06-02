<?php

namespace App\State\ChapterProgress;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\ApiResource\ChapterProgressCreateInput;
use App\Models\Chapter;
use App\Models\ChapterProgress;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * @implements ProcessorInterface<ChapterProgressCreateInput, ChapterProgress>
 */
class ChapterProgressCreateProcessor implements ProcessorInterface
{
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ChapterProgress
    {
        if (!$data instanceof ChapterProgressCreateInput) {
            throw new UnprocessableEntityHttpException('Invalid chapter progress payload.');
        }

        if (!$data->chapter_id || !Chapter::query()->whereKey($data->chapter_id)->exists()) {
            throw new UnprocessableEntityHttpException('Chapter not found.');
        }

        $user = Auth::user();

        if (ChapterProgress::query()->where('user_id', $user->id)->where('chapter_id', $data->chapter_id)->exists()) {
            throw new ConflictHttpException('Progress already exists for this user and chapter.');
        }

        return ChapterProgress::query()->create([
            'user_id'            => $user->id,
            'chapter_id'         => $data->chapter_id,
            'completion_percent' => $data->completion_percent ?? 0,
            'status'             => $data->status ?? 'not_started',
            'last_seen_at'       => null,
        ]);
    }
}

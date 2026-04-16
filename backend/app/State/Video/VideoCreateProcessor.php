<?php

namespace App\State\Video;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\ApiResource\VideoCreateInput;
use App\Models\Chapter;
use App\Models\Video;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * @implements ProcessorInterface<VideoCreateInput, Video>
 */
class VideoCreateProcessor implements ProcessorInterface
{
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Video
    {
        if (!$data instanceof VideoCreateInput) {
            throw new UnprocessableEntityHttpException('Invalid video payload.');
        }

        $chapterId = $data->chapterId
            ?? $data->chapter_id
            ?? (request()->integer('chapter_id') ?: request()->integer('chapterId'));

        if ($chapterId <= 0) {
            throw new UnprocessableEntityHttpException('chapter_id is required.');
        }

        if (!Chapter::query()->whereKey($chapterId)->exists()) {
            throw new UnprocessableEntityHttpException('Chapter not found.');
        }

        if (Video::query()->where('chapter_id', $chapterId)->where('sort_order', $data->sort_order)->exists()) {
            throw new ConflictHttpException('Sort order already exists for this chapter.');
        }

        $user = Auth::user();

        if ($user === null) {
            throw new UnprocessableEntityHttpException('Authenticated user required.');
        }

        return Video::query()->create([
            'chapter_id' => $chapterId,
            'created_by' => $user->id,
            'title' => $data->title,
            'description' => $data->description,
            'source_url' => $data->source_url,
            'duration_seconds' => $data->duration_seconds,
            'sort_order' => $data->sort_order,
            'is_published' => $data->is_published,
        ]);
    }
}

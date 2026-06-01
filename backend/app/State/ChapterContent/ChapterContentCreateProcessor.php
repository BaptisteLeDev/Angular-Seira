<?php

namespace App\State\ChapterContent;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\ApiResource\ChapterContentCreateInput;
use App\Models\Chapter;
use App\Models\ChapterContent;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * @implements ProcessorInterface<ChapterContentCreateInput, ChapterContent>
 */
class ChapterContentCreateProcessor implements ProcessorInterface
{
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ChapterContent
    {
        if (!$data instanceof ChapterContentCreateInput) {
            throw new UnprocessableEntityHttpException('Invalid chapter content payload.');
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

        $body = $data->body ?? request()->input('body') ?? request()->input('content');
        $sourceUrl = $data->source_url ?? request()->input('source_url') ?? request()->input('sourceUrl');
        $filePath = $data->file_path ?? request()->input('file_path') ?? request()->input('filePath');

        $this->validatePayloadByType($data->type, $body, $sourceUrl, $filePath);

        if (ChapterContent::query()->where('chapter_id', $chapterId)->where('sort_order', $data->sort_order)->exists()) {
            throw new ConflictHttpException('Sort order already exists for this chapter.');
        }

        $user = Auth::user();

        if ($user === null) {
            throw new UnprocessableEntityHttpException('Authenticated user required.');
        }

        return ChapterContent::query()->create([
            'chapter_id' => $chapterId,
            'created_by' => $user->id,
            'type' => $data->type,
            'title' => $data->title,
            'description' => $data->description,
            'content' => $body,
            'source_url' => $sourceUrl,
            'file_path' => $filePath,
            'duration_seconds' => $data->duration_seconds,
            'sort_order' => $data->sort_order,
            'is_published' => $data->is_published,
        ]);
    }

    private function validatePayloadByType(string $type, mixed $body, mixed $sourceUrl, mixed $filePath): void
    {
        match ($type) {
            'markdown' => $this->requireValue($body, 'body is required for markdown chapter content.'),
            'video', 'link' => $this->requireValue($sourceUrl, 'source_url is required for video or link chapter content.'),
            'pdf', 'file' => $this->requireValue($filePath, 'file_path is required for file chapter content.'),
            default => throw new UnprocessableEntityHttpException('Unsupported chapter content type.'),
        };
    }

    private function requireValue(?string $value, string $message): void
    {
        if (blank($value)) {
            throw new UnprocessableEntityHttpException($message);
        }
    }
}

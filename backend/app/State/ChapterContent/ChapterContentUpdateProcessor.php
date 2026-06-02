<?php

namespace App\State\ChapterContent;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Models\ChapterContent;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * @implements ProcessorInterface<ChapterContent, ChapterContent>
 */
class ChapterContentUpdateProcessor implements ProcessorInterface
{
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ChapterContent
    {
        $id      = $uriVariables['id'] ?? null;
        $content = ChapterContent::find($id);

        if ($content === null) {
            throw new NotFoundHttpException('Chapter content not found.');
        }

        Gate::authorize('chapter_contents.update', $content);

        $body = request()->json()->all();

        $map = [
            'type'             => ['type'],
            'title'            => ['title'],
            'description'      => ['description'],
            'content'          => ['content'],
            'source_url'       => ['sourceUrl', 'source_url'],
            'file_path'        => ['filePath', 'file_path'],
            'duration_seconds' => ['durationSeconds', 'duration_seconds'],
            'sort_order'       => ['sortOrder', 'sort_order'],
            'is_published'     => ['isPublished', 'is_published'],
        ];

        foreach ($map as $attribute => $keys) {
            foreach ($keys as $key) {
                if (array_key_exists($key, $body)) {
                    $content->$attribute = $body[$key];
                    break;
                }
            }
        }

        $content->save();

        return $content;
    }
}

<?php

namespace App\State\ChapterProgress;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Models\ChapterProgress;
use Illuminate\Http\Request;

/**
 * @implements ProcessorInterface<ChapterProgress, ChapterProgress>
 */
class ChapterProgressCreateProcessor implements ProcessorInterface
{
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ChapterProgress
    {
        if (!$data instanceof ChapterProgress) {
            return $data;
        }

        $request = $context['request'] ?? null;
        $user = $request instanceof Request ? $request->user() : null;

        if ($user !== null) {
            $data->user_id = $user->id;
        }

        $data->save();
        return $data;
    }
}

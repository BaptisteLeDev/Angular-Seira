<?php

namespace App\State\ChapterProgress;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Models\ChapterProgress;
use Illuminate\Http\Request;

/**
 * @implements ProviderInterface<iterable<ChapterProgress>>
 */
class ChapterProgressCollectionProvider implements ProviderInterface
{
    public function provide(Operation $operation, array $uriVariables = [], array $context = []): iterable
    {
        $request = $context['request'] ?? null;
        $user = $request instanceof Request ? $request->user() : null;

        if ($user === null) {
            return collect();
        }

        if ($user->isAdmin()) {
            return ChapterProgress::all();
        }

        return ChapterProgress::where('user_id', $user->id)->get();
    }
}

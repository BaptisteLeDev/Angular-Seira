<?php

namespace App\State\VideoProgress;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Models\VideoProgress;
use Illuminate\Http\Request;

/**
 * @implements ProviderInterface<iterable<VideoProgress>>
 */
class VideoProgressCollectionProvider implements ProviderInterface
{
    public function provide(Operation $operation, array $uriVariables = [], array $context = []): iterable
    {
        $request = $context['request'] ?? null;
        $user = $request instanceof Request ? $request->user() : null;

        if ($user === null) {
            return collect();
        }

        if ($user->isAdmin()) {
            return VideoProgress::all();
        }

        return VideoProgress::where('user_id', $user->id)->get();
    }
}

<?php

namespace App\State\VideoProgress;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\ApiResource\VideoProgressCreateInput;
use App\Models\Video;
use App\Models\VideoProgress;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * @implements ProcessorInterface<VideoProgressCreateInput, VideoProgress>
 */
class VideoProgressCreateProcessor implements ProcessorInterface
{
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): VideoProgress
    {
        if (!$data instanceof VideoProgressCreateInput) {
            throw new UnprocessableEntityHttpException('Invalid video progress payload.');
        }

        $videoId = $data->videoId
            ?? $data->video_id
            ?? (request()->integer('video_id') ?: request()->integer('videoId'));

        if ($videoId <= 0) {
            throw new UnprocessableEntityHttpException('video_id is required.');
        }

        if (!Video::query()->whereKey($videoId)->exists()) {
            throw new UnprocessableEntityHttpException('Video not found.');
        }

        $user = Auth::user();

        if ($user === null) {
            throw new UnprocessableEntityHttpException('Authenticated user required.');
        }

        if (VideoProgress::query()->where('user_id', $user->id)->where('video_id', $videoId)->exists()) {
            throw new ConflictHttpException('Progress already exists for this user and video.');
        }

        // watched_seconds_validated forcé à 0 — seul le heartbeat peut l'incrémenter
        return VideoProgress::query()->create([
            'user_id' => $user->id,
            'video_id' => $videoId,
            'watched_seconds_validated' => 0,
            'completion_percent' => $data->completion_percent,
            'status' => $data->status,
            'last_seen_at' => $data->last_seen_at,
        ]);
    }
}

<?php

namespace App\State\VideoProgress;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\ApiResource\VideoProgressUpdateInput;
use App\Models\VideoProgress;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * @implements ProcessorInterface<VideoProgressUpdateInput, VideoProgress>
 */
class VideoProgressUpdateProcessor implements ProcessorInterface
{
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): VideoProgress
    {
        $id       = $uriVariables['id'] ?? null;
        $progress = VideoProgress::find($id);

        if ($progress === null) {
            throw new NotFoundHttpException('VideoProgress introuvable.');
        }

        // Autorisation ici car API Platform passe le DTO à la gate, pas le modèle
        if (Gate::denies('video_progress.update', $progress)) {
            throw new AccessDeniedHttpException();
        }

        // On lit la request brute pour éviter les problèmes de désérialisation merge-patch.
        // watched_seconds_validated est intentionnellement absent — seul le heartbeat peut le modifier.
        $body     = request()->json()->all();
        $allowed  = ['not_started', 'in_progress', 'completed'];

        if (array_key_exists('completion_percent', $body)) {
            $v = (float) $body['completion_percent'];
            if ($v >= 0.0 && $v <= 100.0) {
                $progress->completion_percent = $v;
            }
        }
        if (array_key_exists('status', $body) && in_array($body['status'], $allowed, true)) {
            $progress->status = $body['status'];
        }
        if (array_key_exists('last_seen_at', $body)) {
            $progress->last_seen_at = $body['last_seen_at'];
        }

        $progress->save();

        return $progress;
    }
}

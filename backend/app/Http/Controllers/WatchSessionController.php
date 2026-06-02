<?php

namespace App\Http\Controllers;

use App\Models\Video;
use App\Models\VideoProgress;
use App\Services\WatchTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class WatchSessionController extends Controller
{
    public function __construct(private readonly WatchTokenService $tokenService) {}

    /**
     * POST /api/watch-sessions/request
     *
     * Émet un token signé pour un segment de vidéo.
     * Le client doit appeler cet endpoint AVANT de commencer à regarder chaque segment.
     *
     * Body: { video_id: int, segment_start: int }
     * Réponse: { token, seg_start, seg_end, expires_at }
     */
    public function request(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'video_id'     => ['required', 'integer', 'exists:videos,id'],
            'segment_start' => ['required', 'integer', 'min:0'],
        ]);

        $video = Video::findOrFail($validated['video_id']);

        Gate::authorize('videos.view', $video);

        try {
            $tokenData = $this->tokenService->generate(
                $request->user()->id,
                $video->id,
                $validated['segment_start'],
                $video->duration_seconds
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json($tokenData, 201);
    }

    /**
     * POST /api/watch-sessions/heartbeat
     *
     * Valide un token de segment et crédite les secondes visionnées.
     * Appelé par le client APRÈS avoir regardé le segment complet.
     *
     * Body: { token: string }
     * Réponse: { validated_seconds, segment_validated, completion_percent, status }
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
        ]);

        $user = $request->user();

        try {
            $payload = $this->tokenService->validate($validated['token'], $user->id);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        $video = Video::find($payload['vid']);
        if ($video === null) {
            return response()->json(['error' => 'Vidéo introuvable.'], 404);
        }

        $segmentDuration = $payload['seg_end'] - $payload['seg_start'];

        // Consommation du nonce — bloque tout replay
        $this->tokenService->consume($payload['nonce']);

        // Upsert progress
        $progress = VideoProgress::query()
            ->where('user_id', $user->id)
            ->where('video_id', $payload['vid'])
            ->first();

        if ($progress === null) {
            $progress              = new VideoProgress();
            $progress->user_id    = $user->id;
            $progress->video_id   = $payload['vid'];
            $progress->watched_seconds_validated = 0;
        }

        $newWatched = min(
            $progress->watched_seconds_validated + $segmentDuration,
            $video->duration_seconds
        );

        $completionPercent = $video->duration_seconds > 0
            ? round(($newWatched / $video->duration_seconds) * 100, 2)
            : 0.0;

        $status = match (true) {
            $completionPercent >= 100 => 'completed',
            $completionPercent > 0    => 'in_progress',
            default                   => 'not_started',
        };

        $progress->watched_seconds_validated = $newWatched;
        $progress->completion_percent        = $completionPercent;
        $progress->status                    = $status;
        $progress->last_seen_at              = now();
        $progress->save();

        return response()->json([
            'validated_seconds'  => $newWatched,
            'segment_validated'  => $segmentDuration,
            'completion_percent' => $completionPercent,
            'status'             => $status,
        ]);
    }
}

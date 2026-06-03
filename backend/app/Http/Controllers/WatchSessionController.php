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

    public function request(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'video_id'      => ['required', 'integer', 'exists:videos,id'],
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

        $video = Video::findOrFail($payload['vid']);

        $segmentDuration = $payload['seg_end'] - $payload['seg_start'];

        $this->tokenService->consume($payload['nonce']);

        $progress = VideoProgress::firstOrNew([
            'user_id'  => $user->id,
            'video_id' => $payload['vid'],
        ]);

        if (!$progress->exists) {
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

<?php

namespace App\Models;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\ApiResource\VideoProgressCreateInput;
use App\State\VideoProgress\VideoProgressCollectionProvider;
use App\State\VideoProgress\VideoProgressCreateProcessor;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ApiResource(
    shortName: 'VideoProgress',
    operations: [
        new GetCollection(
            uriTemplate: '/video-progress',
            policy: 'video_progress.list',
            middleware: ['auth:sanctum'],
            provider: VideoProgressCollectionProvider::class
        ),
        new Get(
            uriTemplate: '/video-progress/{id}',
            policy: 'video_progress.view',
            middleware: ['auth:sanctum']
        ),
        new Post(
            uriTemplate: '/video-progress',
            policy: 'video_progress.create',
            middleware: ['auth:sanctum'],
            input: VideoProgressCreateInput::class,
            processor: VideoProgressCreateProcessor::class
        ),
        new Patch(
            uriTemplate: '/video-progress/{id}',
            policy: 'video_progress.update',
            middleware: ['auth:sanctum']
        ),
        new Delete(
            uriTemplate: '/video-progress/{id}',
            policy: 'video_progress.delete',
            middleware: ['auth:sanctum']
        ),
    ]
)]
class VideoProgress extends Model
{
    use HasFactory;

    protected $table = 'video_progress';

    protected $fillable = [
        'user_id',
        'video_id',
        'watched_seconds_validated',
        'completion_percent',
        'status',
        'last_seen_at',
    ];

    protected $casts = [
        'completion_percent' => 'decimal:2',
        'last_seen_at' => 'datetime',
    ];

    public function getId(): ?int
    {
        return $this->attributes['id'] ?? null;
    }

    public function getUserId(): ?int
    {
        return $this->attributes['user_id'] ?? null;
    }

    public function setUserId(int $userId): void
    {
        $this->attributes['user_id'] = $userId;
    }

    public function getVideoId(): ?int
    {
        return $this->attributes['video_id'] ?? null;
    }

    public function setVideoId(int $videoId): void
    {
        $this->attributes['video_id'] = $videoId;
    }

    public function getWatchedSecondsValidated(): ?int
    {
        return $this->attributes['watched_seconds_validated'] ?? null;
    }

    public function setWatchedSecondsValidated(int $watchedSecondsValidated): void
    {
        $this->attributes['watched_seconds_validated'] = $watchedSecondsValidated;
    }

    public function getCompletionPercent(): float
    {
        return (float) ($this->attributes['completion_percent'] ?? 0);
    }

    public function setCompletionPercent(float $completionPercent): void
    {
        $this->attributes['completion_percent'] = $completionPercent;
    }

    public function getStatus(): ?string
    {
        return $this->attributes['status'] ?? null;
    }

    public function setStatus(string $status): void
    {
        $this->attributes['status'] = $status;
    }

    public function getLastSeenAt(): ?\DateTimeInterface
    {
        return $this->last_seen_at;
    }

    public function setLastSeenAt(?string $lastSeenAt): void
    {
        $this->attributes['last_seen_at'] = $lastSeenAt;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }
}

<?php

namespace App\Models;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\ApiResource\VideoCreateInput;
use App\State\Video\VideoCreateProcessor;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[ApiResource(
    shortName: 'Video',
    operations: [
        new GetCollection(
            uriTemplate: '/videos',
            policy: 'videos.list',
            middleware: ['auth:sanctum']
        ),
        new Get(
            uriTemplate: '/videos/{id}',
            policy: 'videos.view',
            middleware: ['auth:sanctum']
        ),
        new Post(
            uriTemplate: '/videos',
            policy: 'videos.create',
            middleware: ['auth:sanctum'],
            input: VideoCreateInput::class,
            processor: VideoCreateProcessor::class
        ),
        new Patch(
            uriTemplate: '/videos/{id}',
            policy: 'videos.update',
            middleware: ['auth:sanctum']
        ),
        new Delete(
            uriTemplate: '/videos/{id}',
            policy: 'videos.delete',
            middleware: ['auth:sanctum']
        ),
    ]
)]
class Video extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'chapter_id',
        'created_by',
        'title',
        'description',
        'source_url',
        'duration_seconds',
        'sort_order',
        'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
    ];

    public function getId(): ?int
    {
        return $this->attributes['id'] ?? null;
    }

    public function getChapterId(): ?int
    {
        return $this->attributes['chapter_id'] ?? null;
    }

    public function setChapterId(int $chapterId): void
    {
        $this->attributes['chapter_id'] = $chapterId;
    }

    public function getCreatedBy(): ?int
    {
        return $this->attributes['created_by'] ?? null;
    }

    public function setCreatedBy(int $createdBy): void
    {
        $this->attributes['created_by'] = $createdBy;
    }

    public function getTitle(): ?string
    {
        return $this->attributes['title'] ?? null;
    }

    public function setTitle(string $title): void
    {
        $this->attributes['title'] = $title;
    }

    public function getDescription(): ?string
    {
        return $this->attributes['description'] ?? null;
    }

    public function setDescription(?string $description): void
    {
        $this->attributes['description'] = $description;
    }

    public function getSourceUrl(): ?string
    {
        return $this->attributes['source_url'] ?? null;
    }

    public function setSourceUrl(string $sourceUrl): void
    {
        $this->attributes['source_url'] = $sourceUrl;
    }

    public function getDurationSeconds(): ?int
    {
        return $this->attributes['duration_seconds'] ?? null;
    }

    public function setDurationSeconds(int $durationSeconds): void
    {
        $this->attributes['duration_seconds'] = $durationSeconds;
    }

    public function getSortOrder(): ?int
    {
        return $this->attributes['sort_order'] ?? null;
    }

    public function setSortOrder(int $sortOrder): void
    {
        $this->attributes['sort_order'] = $sortOrder;
    }

    public function getIsPublished(): bool
    {
        return (bool) ($this->attributes['is_published'] ?? false);
    }

    public function setIsPublished(bool $isPublished): void
    {
        $this->attributes['is_published'] = $isPublished;
    }

    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function progressEntries(): HasMany
    {
        return $this->hasMany(VideoProgress::class);
    }
}

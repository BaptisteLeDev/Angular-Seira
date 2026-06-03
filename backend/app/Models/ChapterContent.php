<?php

namespace App\Models;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\ApiResource\ChapterContentCreateInput;
use App\State\ChapterContent\ChapterContentCreateProcessor;
use App\State\ChapterContent\ChapterContentUpdateProcessor;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[ApiResource(
    shortName: 'ChapterContent',
    operations: [
        new GetCollection(
            uriTemplate: '/chapter-contents',
            policy: 'chapter_contents.list',
            middleware: ['auth:sanctum']
        ),
        new Get(
            uriTemplate: '/chapter-contents/{id}',
            policy: 'chapter_contents.view',
            middleware: ['auth:sanctum']
        ),
        new Post(
            uriTemplate: '/chapter-contents',
            policy: 'chapter_contents.create',
            middleware: ['auth:sanctum'],
            input: ChapterContentCreateInput::class,
            processor: ChapterContentCreateProcessor::class
        ),
        new Patch(
            uriTemplate: '/chapter-contents/{id}',
            middleware: ['auth:sanctum'],
            processor: ChapterContentUpdateProcessor::class
        ),
        new Delete(
            uriTemplate: '/chapter-contents/{id}',
            policy: 'chapter_contents.delete',
            middleware: ['auth:sanctum']
        ),
    ]
)]
class ChapterContent extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'chapter_id',
        'created_by',
        'type',
        'title',
        'description',
        'content',
        'source_url',
        'file_path',
        'duration_seconds',
        'sort_order',
        'is_published',
    ];

    protected $casts = [
        'duration_seconds' => 'integer',
        'sort_order' => 'integer',
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

    public function getType(): ?string
    {
        return $this->attributes['type'] ?? null;
    }

    public function setType(string $type): void
    {
        $this->attributes['type'] = $type;
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

    public function getContent(): ?string
    {
        return $this->attributes['content'] ?? null;
    }

    public function setContent(?string $content): void
    {
        $this->attributes['content'] = $content;
    }

    public function getSourceUrl(): ?string
    {
        return $this->attributes['source_url'] ?? null;
    }

    public function setSourceUrl(?string $sourceUrl): void
    {
        $this->attributes['source_url'] = $sourceUrl;
    }

    public function getFilePath(): ?string
    {
        return $this->attributes['file_path'] ?? null;
    }

    public function setFilePath(?string $filePath): void
    {
        $this->attributes['file_path'] = $filePath;
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
}

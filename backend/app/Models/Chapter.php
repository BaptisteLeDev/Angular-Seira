<?php

namespace App\Models;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\ApiResource\ChapterCreateInput;
use App\State\Chapter\ChapterCreateProcessor;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[ApiResource(
    shortName: 'Chapter',
    operations: [
        new GetCollection(
            uriTemplate: '/chapters',
            policy: 'chapters.list',
            middleware: ['auth:sanctum']
        ),
        new Get(
            uriTemplate: '/chapters/{id}',
            policy: 'chapters.view',
            middleware: ['auth:sanctum']
        ),
        new Post(
            uriTemplate: '/chapters',
            policy: 'chapters.create',
            middleware: ['auth:sanctum'],
            input: ChapterCreateInput::class,
            processor: ChapterCreateProcessor::class
        ),
        new Patch(
            uriTemplate: '/chapters/{id}',
            policy: 'chapters.update',
            middleware: ['auth:sanctum']
        ),
        new Delete(
            uriTemplate: '/chapters/{id}',
            policy: 'chapters.delete',
            middleware: ['auth:sanctum']
        ),
    ]
)]
class Chapter extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'subject_id',
        'title',
        'sort_order',
    ];

    public function getId(): ?int
    {
        return $this->attributes['id'] ?? null;
    }

    public function getSubjectId(): ?int
    {
        return $this->attributes['subject_id'] ?? null;
    }

    public function setSubjectId(int $subjectId): void
    {
        $this->attributes['subject_id'] = $subjectId;
    }

    public function getTitle(): ?string
    {
        return $this->attributes['title'] ?? null;
    }

    public function setTitle(string $title): void
    {
        $this->attributes['title'] = $title;
    }

    public function getSortOrder(): ?int
    {
        return $this->attributes['sort_order'] ?? null;
    }

    public function setSortOrder(int $sortOrder): void
    {
        $this->attributes['sort_order'] = $sortOrder;
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function videos(): HasMany
    {
        return $this->hasMany(Video::class);
    }

    public function contents(): HasMany
    {
        return $this->hasMany(ChapterContent::class);
    }
}

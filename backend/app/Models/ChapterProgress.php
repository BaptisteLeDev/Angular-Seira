<?php

namespace App\Models;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\State\ChapterProgress\ChapterProgressCollectionProvider;
use App\State\ChapterProgress\ChapterProgressCreateProcessor;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ApiResource(
    shortName: 'ChapterProgress',
    operations: [
        new GetCollection(
            uriTemplate: '/chapter-progress',
            policy: 'chapter_progress.list',
            middleware: ['auth:sanctum'],
            provider: ChapterProgressCollectionProvider::class
        ),
        new Get(
            uriTemplate: '/chapter-progress/{id}',
            policy: 'chapter_progress.view',
            middleware: ['auth:sanctum']
        ),
        new Post(
            uriTemplate: '/chapter-progress',
            policy: 'chapter_progress.create',
            middleware: ['auth:sanctum'],
            input: \App\ApiResource\ChapterProgressCreateInput::class,
            processor: ChapterProgressCreateProcessor::class
        ),
        new Patch(
            uriTemplate: '/chapter-progress/{id}',
            policy: 'chapter_progress.update',
            middleware: ['auth:sanctum']
        ),
        new Delete(
            uriTemplate: '/chapter-progress/{id}',
            policy: 'chapter_progress.delete',
            middleware: ['auth:sanctum']
        ),
    ]
)]
class ChapterProgress extends Model
{
    use HasFactory;

    protected $table = 'chapter_progress';

    protected $fillable = [
        'user_id',
        'chapter_id',
        'completion_percent',
        'status',
        'last_seen_at',
    ];

    protected $casts = [
        'completion_percent' => 'decimal:2',
        'last_seen_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }
}

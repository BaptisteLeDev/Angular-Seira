<?php

namespace App\Models;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\ApiResource\SchoolCreateInput;
use App\State\School\SchoolCreateProcessor;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[ApiResource(
    shortName: 'School',
    operations: [
        new GetCollection(
            uriTemplate: '/schools',
            policy: 'schools.list',
            middleware: ['auth:sanctum']
        ),
        new Get(
            uriTemplate: '/schools/{id}',
            policy: 'schools.view',
            middleware: ['auth:sanctum']
        ),
        new Post(
            uriTemplate: '/schools',
            policy: 'schools.create',
            middleware: ['auth:sanctum'],
            input: SchoolCreateInput::class,
            processor: SchoolCreateProcessor::class
        ),
        new Patch(
            uriTemplate: '/schools/{id}',
            policy: 'schools.update',
            middleware: ['auth:sanctum']
        ),
        new Delete(
            uriTemplate: '/schools/{id}',
            policy: 'schools.delete',
            middleware: ['auth:sanctum']
        ),
    ]
)]
class School extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
    ];

    public function getId(): ?int
    {
        return $this->attributes['id'] ?? null;
    }

    public function getName(): ?string
    {
        return $this->attributes['name'] ?? null;
    }

    public function setName(string $name): void
    {
        $this->attributes['name'] = $name;
    }

    public function getSlug(): ?string
    {
        return $this->attributes['slug'] ?? null;
    }

    public function setSlug(string $slug): void
    {
        $this->attributes['slug'] = $slug;
    }

    public function classrooms(): HasMany
    {
        return $this->hasMany(Classroom::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }
}

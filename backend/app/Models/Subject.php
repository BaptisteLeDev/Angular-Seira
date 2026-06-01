<?php

namespace App\Models;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\ApiResource\SubjectCreateInput;
use App\State\Subject\SubjectCreateProcessor;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[ApiResource(
    shortName: 'Subject',
    operations: [
        new GetCollection(
            uriTemplate: '/subjects',
            policy: 'subjects.list',
            middleware: ['auth:sanctum']
        ),
        new Get(
            uriTemplate: '/subjects/{id}',
            policy: 'subjects.view',
            middleware: ['auth:sanctum']
        ),
        new Post(
            uriTemplate: '/subjects',
            policy: 'subjects.create',
            middleware: ['auth:sanctum'],
            input: SubjectCreateInput::class,
            processor: SubjectCreateProcessor::class
        ),
        new Patch(
            uriTemplate: '/subjects/{id}',
            policy: 'subjects.update',
            middleware: ['auth:sanctum']
        ),
        new Delete(
            uriTemplate: '/subjects/{id}',
            policy: 'subjects.delete',
            middleware: ['auth:sanctum']
        ),
    ]
)]
class Subject extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'school_id',
        'teacher_id',
        'name',
        'description',
        'referential_file_path',
        'expected_hours',
    ];

    public function getId(): ?int
    {
        return $this->attributes['id'] ?? null;
    }

    public function getSchoolId(): ?int
    {
        return $this->attributes['school_id'] ?? null;
    }

    public function setSchoolId(int $schoolId): void
    {
        $this->attributes['school_id'] = $schoolId;
    }

    public function getTeacherId(): ?int
    {
        return $this->attributes['teacher_id'] ?? null;
    }

    public function setTeacherId(int $teacherId): void
    {
        $this->attributes['teacher_id'] = $teacherId;
    }

    public function getName(): ?string
    {
        return $this->attributes['name'] ?? null;
    }

    public function setName(string $name): void
    {
        $this->attributes['name'] = $name;
    }

    public function getDescription(): ?string
    {
        return $this->attributes['description'] ?? null;
    }

    public function setDescription(?string $description): void
    {
        $this->attributes['description'] = $description;
    }

    public function getReferentialFilePath(): ?string
    {
        return $this->attributes['referential_file_path'] ?? null;
    }

    public function setReferentialFilePath(?string $referentialFilePath): void
    {
        $this->attributes['referential_file_path'] = $referentialFilePath;
    }

    public function getExpectedHours(): ?int
    {
        return $this->attributes['expected_hours'] ?? null;
    }

    public function setExpectedHours(int $expectedHours): void
    {
        $this->attributes['expected_hours'] = $expectedHours;
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function classrooms(): BelongsToMany
    {
        return $this->belongsToMany(Classroom::class, 'classroom_subject');
    }

    public function chapters(): HasMany
    {
        return $this->hasMany(Chapter::class);
    }
}

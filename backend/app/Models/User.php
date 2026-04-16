<?php

namespace App\Models;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\ApiResource\UserCreateInput;
use App\State\User\UserCreateProcessor;
// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[ApiResource(
    shortName: 'User',
    operations: [
        new GetCollection(
            uriTemplate: '/users',
            policy: 'users.list',
            middleware: ['auth:sanctum']
        ),
        new Get(
            uriTemplate: '/users/{id}',
            policy: 'users.view',
            middleware: ['auth:sanctum']
        ),
        new Post(
            uriTemplate: '/users',
            policy: 'users.create',
            middleware: ['auth:sanctum'],
            input: UserCreateInput::class,
            processor: UserCreateProcessor::class
        ),
        new Patch(
            uriTemplate: '/users/{id}',
            policy: 'users.update',
            middleware: ['auth:sanctum']
        ),
        new Delete(
            uriTemplate: '/users/{id}',
            policy: 'users.delete',
            middleware: ['auth:sanctum']
        ),
    ]
)]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_ADMIN = 'admin';
    public const ROLE_TEACHER = 'teacher';
    public const ROLE_STUDENT = 'student';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isAdmin(): bool
    {
        return self::ROLE_ADMIN === $this->role;
    }

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

    public function getEmail(): ?string
    {
        return $this->attributes['email'] ?? null;
    }

    public function setEmail(string $email): void
    {
        $this->attributes['email'] = $email;
    }

    public function getRole(): ?string
    {
        return $this->attributes['role'] ?? null;
    }

    public function setRole(string $role): void
    {
        if (!\in_array($role, [self::ROLE_ADMIN, self::ROLE_TEACHER, self::ROLE_STUDENT], true)) {
            return;
        }

        $this->attributes['role'] = $role;
    }

    public function setPassword(string $password): void
    {
        $this->attributes['password'] = $password;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->created_at;
    }
}

<?php

namespace App\State\User;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\ApiResource\UserCreateInput;
use App\Models\User;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * @implements ProcessorInterface<UserCreateInput, User>
 */
class UserCreateProcessor implements ProcessorInterface
{
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): User
    {
        if (!$data instanceof UserCreateInput) {
            throw new UnprocessableEntityHttpException('Invalid user payload.');
        }

        if (User::query()->where('email', $data->email)->exists()) {
            throw new ConflictHttpException('Email already exists.');
        }

        return User::query()->create([
            'name' => $data->name,
            'email' => $data->email,
            'password' => $data->password,
            'role' => $data->role,
        ]);
    }
}

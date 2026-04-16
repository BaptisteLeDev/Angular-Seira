<?php

namespace App\State\Auth;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\ApiResource\AuthLogin;
use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * @implements ProcessorInterface<AuthLogin, JsonResponse>
 */
class AuthLoginProcessor implements ProcessorInterface
{
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): JsonResponse
    {
        if (!$data instanceof AuthLogin) {
            throw new AuthenticationException('Invalid login payload.');
        }

        $user = User::query()->where('email', $data->email)->first();

        if (!$user || !Hash::check($data->password, $user->password)) {
            throw new AuthenticationException('Invalid credentials.');
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return new JsonResponse([
            'tokenType' => 'Bearer',
            'token' => $token,
            'user' => [
                'email' => (string) $user->email,
                'role' => (string) $user->role,
            ],
        ]);
    }
}

<?php

namespace App\State\Auth;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * @implements ProcessorInterface<mixed, JsonResponse>
 */
class AuthMeProcessor implements ProcessorInterface
{
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): JsonResponse
    {
        $request = $context['request'] ?? null;
        if (!$request instanceof Request || !$request->user()) {
            return new JsonResponse(null, 204);
        }

        $user = $request->user();

        return new JsonResponse([
            'id' => (int) $user->id,
            'name' => (string) $user->name,
            'email' => (string) $user->email,
            'role' => (string) $user->role,
        ]);
    }
}

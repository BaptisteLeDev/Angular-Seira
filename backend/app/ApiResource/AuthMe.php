<?php

namespace App\ApiResource;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use App\State\Auth\AuthMeProcessor;

#[ApiResource(
    operations: [
        new Get(
            uriTemplate: '/auth/me',
            read: false,
            write: true,
            output: false,
            processor: AuthMeProcessor::class,
            middleware: ['auth:sanctum']
        ),
    ]
)]
class AuthMe
{
}

<?php

namespace App\ApiResource;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Post;
use App\State\Auth\AuthLogoutProcessor;

#[ApiResource(
    operations: [
        new Post(
            uriTemplate: '/auth/logout',
            read: false,
            deserialize: false,
            processor: AuthLogoutProcessor::class,
            status: 200,
            output: MessageView::class,
            middleware: ['auth:sanctum']
        ),
    ]
)]
class AuthLogout
{
}

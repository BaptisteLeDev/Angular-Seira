<?php

namespace App\ApiResource;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use App\State\Subject\MySubjectsProcessor;

#[ApiResource(
    operations: [
        new Get(
            uriTemplate: '/me/subjects',
            read: false,
            write: true,
            output: false,
            processor: MySubjectsProcessor::class,
            middleware: ['auth:sanctum']
        ),
    ]
)]
class MySubjects
{
}

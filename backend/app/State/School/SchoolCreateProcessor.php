<?php

namespace App\State\School;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\ApiResource\SchoolCreateInput;
use App\Models\School;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * @implements ProcessorInterface<SchoolCreateInput, School>
 */
class SchoolCreateProcessor implements ProcessorInterface
{
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): School
    {
        if (!$data instanceof SchoolCreateInput) {
            throw new UnprocessableEntityHttpException('Invalid school payload.');
        }

        if (School::query()->where('slug', $data->slug)->exists()) {
            throw new ConflictHttpException('Slug already exists.');
        }

        return School::query()->create([
            'name' => $data->name,
            'slug' => $data->slug,
        ]);
    }
}

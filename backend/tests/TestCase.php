<?php

namespace Tests;

use ApiPlatform\Laravel\Eloquent\Metadata\ModelMetadata;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Vide le cache de schéma API Platform peuplé avant les migrations
        $metadata = $this->app->make(ModelMetadata::class);
        $cache    = new \ReflectionProperty($metadata, 'attributesLocalCache');
        $cache->setAccessible(true);
        $cache->setValue($metadata, []);
    }
}

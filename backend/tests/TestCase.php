<?php

namespace Tests;

use ApiPlatform\Laravel\Eloquent\Metadata\ModelMetadata;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Reset the ModelMetadata attribute cache after each test's database migration.
     *
     * API Platform populates this cache during route registration (app boot),
     * which happens BEFORE RefreshDatabase runs the migrations. As a result
     * the cache gets filled with empty column lists (tables don't exist yet).
     * Clearing it here ensures the next request re-queries the live schema.
     */
    protected function setUp(): void
    {
        parent::setUp(); // includes RefreshDatabase migrations

        $metadata = $this->app->make(ModelMetadata::class);
        $cache    = new \ReflectionProperty($metadata, 'attributesLocalCache');
        $cache->setAccessible(true);
        $cache->setValue($metadata, []);
    }
}

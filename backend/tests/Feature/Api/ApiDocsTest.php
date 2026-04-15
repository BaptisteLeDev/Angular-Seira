<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class ApiDocsTest extends TestCase
{
    public function test_api_docs_endpoint_is_available(): void
    {
        $response = $this->get('/api/docs', ['Accept' => 'text/html']);

        $response
            ->assertOk()
            ->assertSee('API Platform', false);
    }
}

<?php

declare(strict_types=1);

$baseConfig = require base_path('vendor/api-platform/laravel/config/api-platform.php');

return array_replace_recursive($baseConfig, [
    'title' => 'Monto API',
    'description' => 'API Monto',
    'swagger_ui' => [
        'enabled' => true,
        'http_auth' => [
            'BearerAuth' => [
                'scheme' => 'bearer',
                'bearerFormat' => 'Token',
            ],
        ],
    ],
]);

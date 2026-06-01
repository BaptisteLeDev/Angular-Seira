<?php

namespace App\ApiResource;

class ChapterProgressCreateInput
{
    public function __construct(
        public ?int $chapter_id = null,
        public ?float $completion_percent = 0,
        public ?string $status = 'not_started',
    ) {}
}

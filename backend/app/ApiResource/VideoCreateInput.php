<?php

namespace App\ApiResource;

use Symfony\Component\Validator\Constraints as Assert;

class VideoCreateInput
{
    public ?int $chapterId = null;

    public ?int $chapter_id = null;

    #[Assert\NotBlank]
    public string $title = '';

    public ?string $description = null;

    #[Assert\NotBlank]
    #[Assert\Url]
    public string $source_url = '';

    #[Assert\PositiveOrZero]
    public int $duration_seconds = 0;

    #[Assert\Positive]
    public int $sort_order = 1;

    public bool $is_published = false;
}

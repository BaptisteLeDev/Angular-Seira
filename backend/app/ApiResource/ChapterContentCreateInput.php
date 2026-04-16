<?php

namespace App\ApiResource;

use Symfony\Component\Validator\Constraints as Assert;

class ChapterContentCreateInput
{
    public ?int $chapterId = null;

    public ?int $chapter_id = null;

    #[Assert\NotBlank]
    #[Assert\Choice(choices: ['video', 'pdf', 'markdown', 'link', 'file'])]
    public string $type = 'markdown';

    #[Assert\NotBlank]
    public string $title = '';

    public ?string $description = null;

    public ?string $body = null;

    public ?string $source_url = null;

    public ?string $file_path = null;

    #[Assert\PositiveOrZero]
    public int $duration_seconds = 0;

    #[Assert\Positive]
    public int $sort_order = 1;

    public bool $is_published = false;
}

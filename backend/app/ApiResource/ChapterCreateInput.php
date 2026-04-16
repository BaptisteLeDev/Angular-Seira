<?php

namespace App\ApiResource;

use Symfony\Component\Validator\Constraints as Assert;

class ChapterCreateInput
{
    public ?int $subjectId = null;

    public ?int $subject_id = null;

    #[Assert\NotBlank]
    public string $title = '';

    #[Assert\NotNull]
    #[Assert\Positive]
    public int $sort_order = 1;
}

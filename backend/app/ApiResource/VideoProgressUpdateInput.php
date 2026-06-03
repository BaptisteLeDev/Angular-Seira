<?php

namespace App\ApiResource;

use Symfony\Component\Validator\Constraints as Assert;

class VideoProgressUpdateInput
{
    #[Assert\Range(min: 0, max: 100)]
    public ?float $completion_percent = null;

    #[Assert\Choice(choices: ['not_started', 'in_progress', 'completed'])]
    public ?string $status = null;

    public ?string $last_seen_at = null;
}

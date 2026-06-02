<?php

namespace App\ApiResource;

use Symfony\Component\Validator\Constraints as Assert;

class VideoProgressCreateInput
{
    public ?int $videoId = null;

    public ?int $video_id = null;

    // watched_seconds_validated n'est pas accepté du client : seul le heartbeat peut l'incrémenter

    #[Assert\Range(min: 0, max: 100)]
    public float $completion_percent = 0;

    #[Assert\Choice(choices: ['not_started', 'in_progress', 'completed'])]
    public string $status = 'not_started';

    public ?string $last_seen_at = null;
}

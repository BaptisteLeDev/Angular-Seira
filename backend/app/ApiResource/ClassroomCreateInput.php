<?php

namespace App\ApiResource;

use Symfony\Component\Validator\Constraints as Assert;

class ClassroomCreateInput
{
    public ?int $schoolId = null;

    public ?int $school_id = null;

    #[Assert\NotBlank]
    public string $level = '';

    #[Assert\NotBlank]
    public string $name = '';

    #[Assert\NotBlank]
    public string $slug = '';
}

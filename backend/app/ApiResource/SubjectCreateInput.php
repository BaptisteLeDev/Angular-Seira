<?php

namespace App\ApiResource;

use Symfony\Component\Validator\Constraints as Assert;

class SubjectCreateInput
{
    public ?int $schoolId = null;

    public ?int $school_id = null;

    public ?int $teacherId = null;

    public ?int $teacher_id = null;

    #[Assert\NotBlank]
    public string $name = '';

    public ?string $description = null;

    public ?string $referential_file_path = null;

    #[Assert\NotNull]
    #[Assert\PositiveOrZero]
    public int $expected_hours = 0;
}

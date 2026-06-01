<?php

namespace App\ApiResource;

use Symfony\Component\Validator\Constraints as Assert;

class SchoolCreateInput
{
    #[Assert\NotBlank]
    public string $name = '';

    #[Assert\NotBlank]
    public string $slug = '';
}

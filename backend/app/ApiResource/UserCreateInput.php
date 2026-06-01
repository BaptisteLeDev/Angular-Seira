<?php

namespace App\ApiResource;

use Symfony\Component\Validator\Constraints as Assert;

class UserCreateInput
{
    #[Assert\NotBlank]
    public string $name = '';

    #[Assert\NotBlank]
    #[Assert\Email]
    public string $email = '';

    #[Assert\NotBlank]
    #[Assert\Length(min: 8)]
    public string $password = '';

    #[Assert\NotBlank]
    #[Assert\Choice(choices: ['admin', 'teacher', 'student'])]
    public string $role = 'student';
}

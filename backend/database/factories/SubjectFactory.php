<?php

namespace Database\Factories;

use App\Models\School;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Subject>
 */
class SubjectFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'teacher_id' => User::factory()->state(['role' => User::ROLE_TEACHER]),
            'name' => fake()->unique()->word().' subject',
            'description' => fake()->sentence(),
            'referential_file_path' => null,
            'expected_hours' => fake()->numberBetween(0, 120),
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\Chapter;
use App\Models\ChapterContent;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ChapterContent>
 */
class ChapterContentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'chapter_id' => Chapter::factory(),
            'created_by' => User::factory()->state(['role' => User::ROLE_TEACHER]),
            'type' => 'markdown',
            'title' => fake()->sentence(4),
            'description' => fake()->sentence(),
            'content' => fake()->paragraph(),
            'source_url' => null,
            'file_path' => null,
            'duration_seconds' => 0,
            'sort_order' => fake()->numberBetween(1, 30),
            'is_published' => true,
        ];
    }
}

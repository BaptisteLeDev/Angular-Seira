<?php

namespace Database\Factories;

use App\Models\Chapter;
use App\Models\User;
use App\Models\Video;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Video>
 */
class VideoFactory extends Factory
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
            'title' => fake()->sentence(4),
            'description' => fake()->sentence(),
            'source_url' => fake()->url(),
            'duration_seconds' => fake()->numberBetween(60, 1200),
            'sort_order' => fake()->numberBetween(1, 30),
            'is_published' => true,
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Video;
use App\Models\VideoProgress;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<VideoProgress>
 */
class VideoProgressFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state(['role' => User::ROLE_STUDENT]),
            'video_id' => Video::factory(),
            'watched_seconds_validated' => fake()->numberBetween(0, 1800),
            'completion_percent' => fake()->randomFloat(2, 0, 100),
            'status' => fake()->randomElement(['not_started', 'in_progress', 'completed']),
            'last_seen_at' => now(),
        ];
    }
}

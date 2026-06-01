<?php

namespace Database\Factories;

use App\Models\Chapter;
use App\Models\ChapterProgress;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ChapterProgress>
 */
class ChapterProgressFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'chapter_id' => Chapter::factory(),
            'completion_percent' => $this->faker->numberBetween(0, 100),
            'status' => $this->faker->randomElement(['not_started', 'in_progress', 'completed']),
            'last_seen_at' => now(),
        ];
    }
}

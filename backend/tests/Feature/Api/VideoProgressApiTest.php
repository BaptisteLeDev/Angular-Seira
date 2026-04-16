<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Video;
use App\Models\VideoProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VideoProgressApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_video_progress_entries(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        VideoProgress::factory()->count(2)->create();
        Sanctum::actingAs($admin);

        $this->getJson('/api/video-progress')
            ->assertOk();
    }

    public function test_student_can_list_video_progress_entries(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        Sanctum::actingAs($student);

        $this->getJson('/api/video-progress')->assertOk();
    }

    public function test_student_can_create_own_video_progress(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $video = Video::factory()->create();
        Sanctum::actingAs($student);

        $this->postJson('/api/video-progress', [
            'video_id' => $video->id,
            'watched_seconds_validated' => 120,
            'completion_percent' => 35,
            'status' => 'in_progress',
        ])->assertCreated();
    }
}

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

        $this->getJson('/api/video-progress')->assertOk();
    }

    public function test_student_can_list_video_progress_entries(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        Sanctum::actingAs($student);

        $this->getJson('/api/video-progress')->assertOk();
    }

    public function test_student_can_view_own_video_progress(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $video = Video::factory()->create();
        $progress = VideoProgress::factory()->create(['user_id' => $student->id, 'video_id' => $video->id]);
        Sanctum::actingAs($student);

        $this->getJson("/api/video-progress/{$progress->id}")->assertOk();
    }

    public function test_student_cannot_view_other_student_video_progress(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $other = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $video = Video::factory()->create();
        $progress = VideoProgress::factory()->create(['user_id' => $other->id, 'video_id' => $video->id]);
        Sanctum::actingAs($student);

        $this->getJson("/api/video-progress/{$progress->id}")->assertForbidden();
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

    public function test_student_cannot_update_other_student_video_progress(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $other = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $video = Video::factory()->create();
        $progress = VideoProgress::factory()->create(['user_id' => $other->id, 'video_id' => $video->id]);
        Sanctum::actingAs($student);

        $this->patchJson("/api/video-progress/{$progress->id}", [
            'watched_seconds_validated' => 200,
        ])->assertForbidden();
    }

    public function test_student_cannot_delete_other_student_video_progress(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $other = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $video = Video::factory()->create();
        $progress = VideoProgress::factory()->create(['user_id' => $other->id, 'video_id' => $video->id]);
        Sanctum::actingAs($student);

        $this->deleteJson("/api/video-progress/{$progress->id}")->assertForbidden();
    }
}

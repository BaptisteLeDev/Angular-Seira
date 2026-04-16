<?php

namespace Tests\Feature\Api;

use App\Models\Chapter;
use App\Models\School;
use App\Models\Subject;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VideoApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_videos(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        Video::factory()->count(2)->create();
        Sanctum::actingAs($admin);

        $this->getJson('/api/videos')
            ->assertOk();
    }

    public function test_student_can_list_videos(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        Sanctum::actingAs($student);

        $this->getJson('/api/videos')->assertOk();
    }

    public function test_admin_can_create_video(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $school = School::factory()->create();
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER, 'school_id' => $school->id]);
        $subject = Subject::factory()->create([
            'school_id' => $school->id,
            'teacher_id' => $teacher->id,
        ]);
        $chapter = Chapter::factory()->create(['subject_id' => $subject->id]);
        Sanctum::actingAs($admin);

        $this->postJson('/api/videos', [
            'chapter_id' => $chapter->id,
            'title' => 'Video intro',
            'description' => 'Support video',
            'source_url' => 'https://example.com/video-intro',
            'duration_seconds' => 300,
            'sort_order' => 1,
            'is_published' => true,
        ])->assertCreated();
    }
}

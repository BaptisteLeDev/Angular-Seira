<?php

namespace Tests\Feature\Api;

use App\Models\Chapter;
use App\Models\Classroom;
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

        $this->getJson('/api/videos')->assertOk();
    }

    public function test_student_can_list_videos(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        Sanctum::actingAs($student);

        $this->getJson('/api/videos')->assertOk();
    }

    public function test_student_can_view_video_of_their_classroom(): void
    {
        $school = School::factory()->create();
        $classroom = Classroom::factory()->create(['school_id' => $school->id]);
        $subject = Subject::factory()->create(['school_id' => $school->id]);
        $classroom->subjects()->attach($subject->id);
        $chapter = Chapter::factory()->create(['subject_id' => $subject->id]);
        $video = Video::factory()->create(['chapter_id' => $chapter->id]);

        $student = User::factory()->create([
            'role' => User::ROLE_STUDENT,
            'school_id' => $school->id,
            'classroom_id' => $classroom->id,
        ]);
        Sanctum::actingAs($student);

        $this->getJson("/api/videos/{$video->id}")->assertOk();
    }

    public function test_student_cannot_view_video_outside_their_classroom(): void
    {
        $school = School::factory()->create();
        $classroom = Classroom::factory()->create(['school_id' => $school->id]);
        $otherSubject = Subject::factory()->create(['school_id' => $school->id]);
        $chapter = Chapter::factory()->create(['subject_id' => $otherSubject->id]);
        $video = Video::factory()->create(['chapter_id' => $chapter->id]);

        $student = User::factory()->create([
            'role' => User::ROLE_STUDENT,
            'school_id' => $school->id,
            'classroom_id' => $classroom->id,
        ]);
        Sanctum::actingAs($student);

        $this->getJson("/api/videos/{$video->id}")->assertForbidden();
    }

    public function test_teacher_can_view_video_of_taught_subject(): void
    {
        $school = School::factory()->create();
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER, 'school_id' => $school->id]);
        $subject = Subject::factory()->create(['school_id' => $school->id, 'teacher_id' => $teacher->id]);
        $chapter = Chapter::factory()->create(['subject_id' => $subject->id]);
        $video = Video::factory()->create(['chapter_id' => $chapter->id]);
        Sanctum::actingAs($teacher);

        $this->getJson("/api/videos/{$video->id}")->assertOk();
    }

    public function test_teacher_cannot_view_video_of_other_subject(): void
    {
        $school = School::factory()->create();
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER, 'school_id' => $school->id]);
        $otherSubject = Subject::factory()->create(['school_id' => $school->id]);
        $chapter = Chapter::factory()->create(['subject_id' => $otherSubject->id]);
        $video = Video::factory()->create(['chapter_id' => $chapter->id]);
        Sanctum::actingAs($teacher);

        $this->getJson("/api/videos/{$video->id}")->assertForbidden();
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

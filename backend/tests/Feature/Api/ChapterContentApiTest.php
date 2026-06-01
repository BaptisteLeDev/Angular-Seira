<?php

namespace Tests\Feature\Api;

use App\Models\Chapter;
use App\Models\ChapterContent;
use App\Models\Classroom;
use App\Models\School;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChapterContentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_chapter_contents(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        ChapterContent::factory()->count(2)->create();
        Sanctum::actingAs($admin);

        $this->getJson('/api/chapter-contents')->assertOk();
    }

    public function test_student_can_list_chapter_contents(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        Sanctum::actingAs($student);

        $this->getJson('/api/chapter-contents')->assertOk();
    }

    public function test_student_can_view_chapter_content_of_their_classroom(): void
    {
        $school = School::factory()->create();
        $classroom = Classroom::factory()->create(['school_id' => $school->id]);
        $subject = Subject::factory()->create(['school_id' => $school->id]);
        $classroom->subjects()->attach($subject->id);
        $chapter = Chapter::factory()->create(['subject_id' => $subject->id]);
        $content = ChapterContent::factory()->create(['chapter_id' => $chapter->id]);

        $student = User::factory()->create([
            'role' => User::ROLE_STUDENT,
            'school_id' => $school->id,
            'classroom_id' => $classroom->id,
        ]);
        Sanctum::actingAs($student);

        $this->getJson("/api/chapter-contents/{$content->id}")->assertOk();
    }

    public function test_student_cannot_view_chapter_content_outside_their_classroom(): void
    {
        $school = School::factory()->create();
        $classroom = Classroom::factory()->create(['school_id' => $school->id]);
        $otherSubject = Subject::factory()->create(['school_id' => $school->id]);
        $chapter = Chapter::factory()->create(['subject_id' => $otherSubject->id]);
        $content = ChapterContent::factory()->create(['chapter_id' => $chapter->id]);

        $student = User::factory()->create([
            'role' => User::ROLE_STUDENT,
            'school_id' => $school->id,
            'classroom_id' => $classroom->id,
        ]);
        Sanctum::actingAs($student);

        $this->getJson("/api/chapter-contents/{$content->id}")->assertForbidden();
    }

    public function test_teacher_can_view_chapter_content_of_taught_subject(): void
    {
        $school = School::factory()->create();
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER, 'school_id' => $school->id]);
        $subject = Subject::factory()->create(['school_id' => $school->id, 'teacher_id' => $teacher->id]);
        $chapter = Chapter::factory()->create(['subject_id' => $subject->id]);
        $content = ChapterContent::factory()->create(['chapter_id' => $chapter->id]);
        Sanctum::actingAs($teacher);

        $this->getJson("/api/chapter-contents/{$content->id}")->assertOk();
    }

    public function test_teacher_cannot_view_chapter_content_of_other_subject(): void
    {
        $school = School::factory()->create();
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER, 'school_id' => $school->id]);
        $otherSubject = Subject::factory()->create(['school_id' => $school->id]);
        $chapter = Chapter::factory()->create(['subject_id' => $otherSubject->id]);
        $content = ChapterContent::factory()->create(['chapter_id' => $chapter->id]);
        Sanctum::actingAs($teacher);

        $this->getJson("/api/chapter-contents/{$content->id}")->assertForbidden();
    }

    public function test_admin_can_create_markdown_chapter_content(): void
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

        $this->postJson('/api/chapter-contents', [
            'chapter_id' => $chapter->id,
            'type' => 'markdown',
            'title' => 'Introduction',
            'body' => '# Introduction',
            'sort_order' => 1,
            'is_published' => true,
        ])->assertCreated();
    }

    public function test_admin_can_patch_video_content_with_integer_fields(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $chapter = Chapter::factory()->create();
        $content = ChapterContent::factory()->create([
            'chapter_id' => $chapter->id,
            'type' => 'video',
            'duration_seconds' => 420,
            'sort_order' => 1,
        ]);
        Sanctum::actingAs($admin);

        $this->json('PATCH', "/api/chapter-contents/{$content->id}", [
            'durationSeconds' => 500,
            'sortOrder' => 2,
        ], ['Content-Type' => 'application/merge-patch+json'])
            ->assertOk()
            ->assertJson([
                'durationSeconds' => 500,
                'sortOrder' => 2,
            ]);
    }
}

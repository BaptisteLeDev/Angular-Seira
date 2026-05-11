<?php

namespace Tests\Feature\Api;

use App\Models\Chapter;
use App\Models\Classroom;
use App\Models\School;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChapterApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_chapters(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        Chapter::factory()->count(2)->create();
        Sanctum::actingAs($admin);

        $this->getJson('/api/chapters')->assertOk();
    }

    public function test_student_cannot_list_chapters(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        Sanctum::actingAs($student);

        $this->getJson('/api/chapters')->assertForbidden();
    }

    public function test_student_can_view_chapter_of_their_classroom(): void
    {
        $school = School::factory()->create();
        $classroom = Classroom::factory()->create(['school_id' => $school->id]);
        $subject = Subject::factory()->create(['school_id' => $school->id]);
        $classroom->subjects()->attach($subject->id);
        $chapter = Chapter::factory()->create(['subject_id' => $subject->id]);

        $student = User::factory()->create([
            'role' => User::ROLE_STUDENT,
            'school_id' => $school->id,
            'classroom_id' => $classroom->id,
        ]);
        Sanctum::actingAs($student);

        $this->getJson("/api/chapters/{$chapter->id}")->assertOk();
    }

    public function test_student_cannot_view_chapter_outside_their_classroom(): void
    {
        $school = School::factory()->create();
        $classroom = Classroom::factory()->create(['school_id' => $school->id]);
        $otherSubject = Subject::factory()->create(['school_id' => $school->id]);
        $chapter = Chapter::factory()->create(['subject_id' => $otherSubject->id]);

        $student = User::factory()->create([
            'role' => User::ROLE_STUDENT,
            'school_id' => $school->id,
            'classroom_id' => $classroom->id,
        ]);
        Sanctum::actingAs($student);

        $this->getJson("/api/chapters/{$chapter->id}")->assertForbidden();
    }

    public function test_teacher_can_view_chapter_of_taught_subject(): void
    {
        $school = School::factory()->create();
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER, 'school_id' => $school->id]);
        $subject = Subject::factory()->create(['school_id' => $school->id, 'teacher_id' => $teacher->id]);
        $chapter = Chapter::factory()->create(['subject_id' => $subject->id]);
        Sanctum::actingAs($teacher);

        $this->getJson("/api/chapters/{$chapter->id}")->assertOk();
    }

    public function test_teacher_cannot_view_chapter_of_other_subject(): void
    {
        $school = School::factory()->create();
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER, 'school_id' => $school->id]);
        $otherSubject = Subject::factory()->create(['school_id' => $school->id]);
        $chapter = Chapter::factory()->create(['subject_id' => $otherSubject->id]);
        Sanctum::actingAs($teacher);

        $this->getJson("/api/chapters/{$chapter->id}")->assertForbidden();
    }

    public function test_admin_can_create_chapter(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $school = School::factory()->create();
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER, 'school_id' => $school->id]);
        $subject = Subject::factory()->create([
            'school_id' => $school->id,
            'teacher_id' => $teacher->id,
        ]);
        Sanctum::actingAs($admin);

        $this->postJson('/api/chapters', [
            'subject_id' => $subject->id,
            'title' => 'Introduction',
            'sort_order' => 1,
        ])->assertCreated();
    }
}

<?php

namespace Tests\Feature\Api;

use App\Models\Chapter;
use App\Models\ChapterProgress;
use App\Models\Classroom;
use App\Models\School;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChapterProgressApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_track_chapter_progress(): void
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

        ChapterProgress::factory()->create([
            'user_id' => $student->id,
            'chapter_id' => $chapter->id,
            'completion_percent' => 50,
            'status' => 'in_progress',
        ]);

        $this->assertDatabaseHas('chapter_progress', [
            'user_id' => $student->id,
            'chapter_id' => $chapter->id,
            'completion_percent' => 50,
            'status' => 'in_progress',
        ]);
    }

    public function test_student_can_view_own_chapter_progress(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $chapter = Chapter::factory()->create();
        $progress = ChapterProgress::factory()->create(['user_id' => $student->id, 'chapter_id' => $chapter->id]);
        Sanctum::actingAs($student);

        $this->getJson("/api/chapter-progress/{$progress->id}")->assertOk();
    }

    public function test_student_cannot_view_other_student_chapter_progress(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $other = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $chapter = Chapter::factory()->create();
        $progress = ChapterProgress::factory()->create(['user_id' => $other->id, 'chapter_id' => $chapter->id]);
        Sanctum::actingAs($student);

        $this->getJson("/api/chapter-progress/{$progress->id}")->assertForbidden();
    }

    public function test_student_can_list_own_chapter_progress(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $other = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $chapter1 = Chapter::factory()->create();
        $chapter2 = Chapter::factory()->create();

        ChapterProgress::factory()->create(['user_id' => $student->id, 'chapter_id' => $chapter1->id]);
        ChapterProgress::factory()->create(['user_id' => $other->id, 'chapter_id' => $chapter2->id]);

        Sanctum::actingAs($student);

        $response = $this->getJson('/api/chapter-progress')->assertOk();
        $this->assertCount(1, $response->json());
    }

    public function test_student_cannot_update_other_student_chapter_progress(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $other = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $chapter = Chapter::factory()->create();
        $progress = ChapterProgress::factory()->create(['user_id' => $other->id, 'chapter_id' => $chapter->id]);
        Sanctum::actingAs($student);

        $this->json('PATCH', "/api/chapter-progress/{$progress->id}", [
            'completion_percent' => 100,
        ], ['Content-Type' => 'application/merge-patch+json'])->assertForbidden();
    }

    public function test_admin_can_view_all_chapter_progress(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $chapter = Chapter::factory()->create();
        ChapterProgress::factory()->create(['user_id' => $student->id, 'chapter_id' => $chapter->id]);
        Sanctum::actingAs($admin);

        $this->getJson('/api/chapter-progress')->assertOk();
    }
}

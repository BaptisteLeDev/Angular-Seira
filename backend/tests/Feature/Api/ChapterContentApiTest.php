<?php

namespace Tests\Feature\Api;

use App\Models\Chapter;
use App\Models\ChapterContent;
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

        $this->getJson('/api/chapter-contents')
            ->assertOk();
    }

    public function test_student_can_list_chapter_contents(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        Sanctum::actingAs($student);

        $this->getJson('/api/chapter-contents')->assertOk();
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
        $chapter = Chapter::factory()->create([
            'subject_id' => $subject->id,
        ]);
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
}

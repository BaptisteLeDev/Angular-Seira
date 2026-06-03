<?php

namespace Tests\Feature\Api;

use App\Models\Classroom;
use App\Models\School;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SubjectApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_subjects(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        Subject::factory()->count(2)->create();
        Sanctum::actingAs($admin);

        $this->getJson('/api/subjects')
            ->assertOk();
    }

    public function test_teacher_can_list_subjects(): void
    {
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER]);
        Subject::factory()->count(2)->create();
        Sanctum::actingAs($teacher);

        $this->getJson('/api/subjects')->assertOk();
    }

    public function test_student_cannot_list_subjects(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        Sanctum::actingAs($student);

        $this->getJson('/api/subjects')->assertForbidden();
    }

    public function test_admin_can_create_subject(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $school = School::factory()->create();
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER]);
        Sanctum::actingAs($admin);

        $this->postJson('/api/subjects', [
            'school_id' => $school->id,
            'teacher_id' => $teacher->id,
            'name' => 'Mathématiques',
            'description' => 'Cours de maths',
            'referential_file_path' => null,
            'expected_hours' => 42,
        ])->assertCreated();
    }

    public function test_teacher_can_view_their_subject(): void
    {
        $school = School::factory()->create();
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER, 'school_id' => $school->id]);
        $subject = Subject::factory()->create(['school_id' => $school->id, 'teacher_id' => $teacher->id]);
        Sanctum::actingAs($teacher);

        $this->getJson("/api/subjects/{$subject->id}")->assertOk();
    }

    public function test_teacher_cannot_view_other_subject(): void
    {
        $school = School::factory()->create();
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER, 'school_id' => $school->id]);
        $otherSubject = Subject::factory()->create(['school_id' => $school->id]);
        Sanctum::actingAs($teacher);

        $this->getJson("/api/subjects/{$otherSubject->id}")->assertForbidden();
    }

    public function test_student_can_view_subject_of_their_classroom(): void
    {
        $school = School::factory()->create();
        $classroom = Classroom::factory()->create(['school_id' => $school->id]);
        $subject = Subject::factory()->create(['school_id' => $school->id]);
        $classroom->subjects()->attach($subject->id);

        $student = User::factory()->create([
            'role' => User::ROLE_STUDENT,
            'school_id' => $school->id,
            'classroom_id' => $classroom->id,
        ]);
        Sanctum::actingAs($student);

        $this->getJson("/api/subjects/{$subject->id}")->assertOk();
    }

    public function test_student_cannot_view_subject_outside_their_classroom(): void
    {
        $school = School::factory()->create();
        $classroom = Classroom::factory()->create(['school_id' => $school->id]);
        $otherSubject = Subject::factory()->create(['school_id' => $school->id]);

        $student = User::factory()->create([
            'role' => User::ROLE_STUDENT,
            'school_id' => $school->id,
            'classroom_id' => $classroom->id,
        ]);
        Sanctum::actingAs($student);

        $this->getJson("/api/subjects/{$otherSubject->id}")->assertForbidden();
    }
}

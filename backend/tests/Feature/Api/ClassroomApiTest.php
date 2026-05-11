<?php

namespace Tests\Feature\Api;

use App\Models\Classroom;
use App\Models\School;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClassroomApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_classrooms(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        Classroom::factory()->count(2)->create();
        Sanctum::actingAs($admin);

        $this->getJson('/api/classrooms')->assertOk();
    }

    public function test_student_cannot_list_classrooms(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        Sanctum::actingAs($student);

        $this->getJson('/api/classrooms')->assertForbidden();
    }

    public function test_student_can_view_own_classroom(): void
    {
        $school = School::factory()->create();
        $classroom = Classroom::factory()->create(['school_id' => $school->id]);
        $student = User::factory()->create([
            'role' => User::ROLE_STUDENT,
            'school_id' => $school->id,
            'classroom_id' => $classroom->id,
        ]);
        Sanctum::actingAs($student);

        $this->getJson("/api/classrooms/{$classroom->id}")->assertOk();
    }

    public function test_student_cannot_view_other_classroom(): void
    {
        $school = School::factory()->create();
        $classroom = Classroom::factory()->create(['school_id' => $school->id]);
        $otherClassroom = Classroom::factory()->create(['school_id' => $school->id]);
        $student = User::factory()->create([
            'role' => User::ROLE_STUDENT,
            'school_id' => $school->id,
            'classroom_id' => $classroom->id,
        ]);
        Sanctum::actingAs($student);

        $this->getJson("/api/classrooms/{$otherClassroom->id}")->assertForbidden();
    }

    public function test_teacher_can_view_classroom_linked_to_taught_subject(): void
    {
        $school = School::factory()->create();
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER, 'school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['school_id' => $school->id]);
        $subject = Subject::factory()->create(['school_id' => $school->id, 'teacher_id' => $teacher->id]);
        $classroom->subjects()->attach($subject->id);
        Sanctum::actingAs($teacher);

        $this->getJson("/api/classrooms/{$classroom->id}")->assertOk();
    }

    public function test_teacher_cannot_view_classroom_not_linked_to_taught_subject(): void
    {
        $school = School::factory()->create();
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER, 'school_id' => $school->id]);
        $classroom = Classroom::factory()->create(['school_id' => $school->id]);
        Sanctum::actingAs($teacher);

        $this->getJson("/api/classrooms/{$classroom->id}")->assertForbidden();
    }

    public function test_admin_can_create_classroom(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $school = School::factory()->create();
        Sanctum::actingAs($admin);

        $this->postJson('/api/classrooms', [
            'school_id' => $school->id,
            'level' => '6eme',
            'name' => '6eme A',
            'slug' => '6eme-a',
        ])->assertCreated();
    }
}

<?php

namespace Tests\Feature\Api;

use App\Models\Classroom;
use App\Models\School;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MySubjectsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_me_subjects_requires_authentication(): void
    {
        $this->getJson('/api/me/subjects')->assertUnauthorized();
    }

    public function test_student_sees_classroom_subjects_as_available(): void
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

        $response = $this->getJson('/api/me/subjects')->assertOk();

        $this->assertCount(1, $response->json('available'));
        $this->assertCount(0, $response->json('locked'));
        $this->assertEquals($subject->id, $response->json('available.0.id'));
    }

    public function test_student_sees_non_classroom_school_subjects_as_locked(): void
    {
        $school = School::factory()->create();
        $classroom = Classroom::factory()->create(['school_id' => $school->id]);
        $available = Subject::factory()->create(['school_id' => $school->id]);
        $locked = Subject::factory()->create(['school_id' => $school->id]);
        $classroom->subjects()->attach($available->id);

        $student = User::factory()->create([
            'role' => User::ROLE_STUDENT,
            'school_id' => $school->id,
            'classroom_id' => $classroom->id,
        ]);
        Sanctum::actingAs($student);

        $response = $this->getJson('/api/me/subjects')->assertOk();

        $this->assertCount(1, $response->json('available'));
        $this->assertCount(1, $response->json('locked'));
        $this->assertEquals($locked->id, $response->json('locked.0.id'));
    }

    public function test_student_without_classroom_gets_empty_lists(): void
    {
        $school = School::factory()->create();
        $student = User::factory()->create([
            'role' => User::ROLE_STUDENT,
            'school_id' => $school->id,
            'classroom_id' => null,
        ]);
        Sanctum::actingAs($student);

        $response = $this->getJson('/api/me/subjects')->assertOk();

        $this->assertEmpty($response->json('available'));
        $this->assertEmpty($response->json('locked'));
    }

    public function test_teacher_sees_only_taught_subjects(): void
    {
        $school = School::factory()->create();
        $teacher = User::factory()->create([
            'role' => User::ROLE_TEACHER,
            'school_id' => $school->id,
        ]);
        $taught = Subject::factory()->create(['school_id' => $school->id, 'teacher_id' => $teacher->id]);
        Subject::factory()->create(['school_id' => $school->id]);
        Sanctum::actingAs($teacher);

        $response = $this->getJson('/api/me/subjects')->assertOk();

        $this->assertCount(1, $response->json('available'));
        $this->assertEmpty($response->json('locked'));
        $this->assertEquals($taught->id, $response->json('available.0.id'));
    }

    public function test_admin_sees_all_school_subjects(): void
    {
        $school = School::factory()->create();
        $admin = User::factory()->create([
            'role' => User::ROLE_ADMIN,
            'school_id' => $school->id,
        ]);
        Subject::factory()->count(3)->create(['school_id' => $school->id]);
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/me/subjects')->assertOk();

        $this->assertCount(3, $response->json('available'));
        $this->assertEmpty($response->json('locked'));
    }
}

<?php

namespace Tests\Feature\Api;

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
}

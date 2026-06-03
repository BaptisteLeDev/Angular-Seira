<?php

namespace Tests\Feature\Api;

use App\Models\Classroom;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserSchoolTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // GET /api/users/{id}/schools
    // -------------------------------------------------------------------------

    public function test_list_returns_401_without_auth(): void
    {
        $user = User::factory()->create();
        $this->getJson("/api/users/{$user->id}/schools")->assertUnauthorized();
    }

    public function test_admin_can_list_user_schools(): void
    {
        $admin   = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER]);
        $school  = School::factory()->create();
        $teacher->schools()->attach($school->id);
        Sanctum::actingAs($admin);

        $response = $this->getJson("/api/users/{$teacher->id}/schools")->assertOk();

        $this->assertCount(1, $response->json());
        $this->assertEquals($school->id, $response->json('0.id'));
    }

    public function test_list_returns_empty_when_user_has_no_school(): void
    {
        $admin   = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER, 'school_id' => null]);
        Sanctum::actingAs($admin);

        $response = $this->getJson("/api/users/{$teacher->id}/schools")->assertOk();
        $this->assertCount(0, $response->json());
    }

    // -------------------------------------------------------------------------
    // POST /api/users/{id}/schools — teacher / admin (multi-école)
    // -------------------------------------------------------------------------

    public function test_assign_returns_401_without_auth(): void
    {
        $user   = User::factory()->create();
        $school = School::factory()->create();
        $this->postJson("/api/users/{$user->id}/schools", ['school_id' => $school->id])
            ->assertUnauthorized();
    }

    public function test_admin_can_assign_teacher_to_school(): void
    {
        $admin   = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER, 'school_id' => null]);
        $school  = School::factory()->create();
        Sanctum::actingAs($admin);

        $this->postJson("/api/users/{$teacher->id}/schools", ['school_id' => $school->id])
            ->assertCreated();

        $this->assertDatabaseHas('user_school', [
            'user_id'   => $teacher->id,
            'school_id' => $school->id,
        ]);

        // school_id principal mis à jour car l'utilisateur n'en avait pas
        $this->assertDatabaseHas('users', [
            'id'        => $teacher->id,
            'school_id' => $school->id,
        ]);
    }

    public function test_teacher_can_be_assigned_to_multiple_schools(): void
    {
        $admin   = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER, 'school_id' => null]);
        $school1 = School::factory()->create();
        $school2 = School::factory()->create();
        Sanctum::actingAs($admin);

        $this->postJson("/api/users/{$teacher->id}/schools", ['school_id' => $school1->id])->assertCreated();
        $this->postJson("/api/users/{$teacher->id}/schools", ['school_id' => $school2->id])->assertCreated();

        $this->assertCount(2, $teacher->schools()->get());
    }

    public function test_assigning_same_school_twice_returns_409(): void
    {
        $admin   = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER]);
        $school  = School::factory()->create();
        $teacher->schools()->attach($school->id);
        Sanctum::actingAs($admin);

        $this->postJson("/api/users/{$teacher->id}/schools", ['school_id' => $school->id])
            ->assertConflict();
    }

    // -------------------------------------------------------------------------
    // POST /api/users/{id}/schools — élève (1 école max)
    // -------------------------------------------------------------------------

    public function test_admin_can_assign_student_to_school(): void
    {
        $admin   = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $student = User::factory()->create(['role' => User::ROLE_STUDENT, 'school_id' => null]);
        $school  = School::factory()->create();
        Sanctum::actingAs($admin);

        $this->postJson("/api/users/{$student->id}/schools", ['school_id' => $school->id])
            ->assertOk();

        $this->assertDatabaseHas('users', ['id' => $student->id, 'school_id' => $school->id]);
        $this->assertCount(1, $student->schools()->get());
    }

    public function test_student_is_transferred_when_assigned_to_new_school(): void
    {
        $admin    = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $school1  = School::factory()->create();
        $school2  = School::factory()->create();
        $classroom = Classroom::factory()->create(['school_id' => $school1->id]);
        $student  = User::factory()->create([
            'role'         => User::ROLE_STUDENT,
            'school_id'    => $school1->id,
            'classroom_id' => $classroom->id,
        ]);
        $student->schools()->attach($school1->id);
        Sanctum::actingAs($admin);

        $this->postJson("/api/users/{$student->id}/schools", ['school_id' => $school2->id])
            ->assertOk();

        $fresh = $student->fresh();
        // Nouvelle école assignée
        $this->assertEquals($school2->id, $fresh->school_id);
        // classroom_id vidé (elle appartient à l'ancienne école)
        $this->assertNull($fresh->classroom_id);
        // L'étudiant n'est plus dans school1 via le pivot
        $this->assertDatabaseMissing('user_school', ['user_id' => $student->id, 'school_id' => $school1->id]);
        $this->assertDatabaseHas('user_school',    ['user_id' => $student->id, 'school_id' => $school2->id]);
    }

    public function test_assigning_student_to_same_school_returns_409(): void
    {
        $admin   = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $school  = School::factory()->create();
        $student = User::factory()->create(['role' => User::ROLE_STUDENT, 'school_id' => $school->id]);
        $student->schools()->attach($school->id);
        Sanctum::actingAs($admin);

        $this->postJson("/api/users/{$student->id}/schools", ['school_id' => $school->id])
            ->assertConflict();
    }

    // -------------------------------------------------------------------------
    // DELETE /api/users/{id}/schools/{schoolId}
    // -------------------------------------------------------------------------

    public function test_remove_returns_401_without_auth(): void
    {
        $user   = User::factory()->create();
        $school = School::factory()->create();
        $this->deleteJson("/api/users/{$user->id}/schools/{$school->id}")
            ->assertUnauthorized();
    }

    public function test_admin_can_remove_teacher_from_school(): void
    {
        $admin   = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER]);
        $school  = School::factory()->create();
        $teacher->schools()->attach($school->id);
        Sanctum::actingAs($admin);

        $this->deleteJson("/api/users/{$teacher->id}/schools/{$school->id}")->assertOk();

        $this->assertDatabaseMissing('user_school', ['user_id' => $teacher->id, 'school_id' => $school->id]);
    }

    public function test_removing_student_from_school_clears_school_and_classroom(): void
    {
        $admin    = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $school   = School::factory()->create();
        $classroom = Classroom::factory()->create(['school_id' => $school->id]);
        $student  = User::factory()->create([
            'role'         => User::ROLE_STUDENT,
            'school_id'    => $school->id,
            'classroom_id' => $classroom->id,
        ]);
        $student->schools()->attach($school->id);
        Sanctum::actingAs($admin);

        $this->deleteJson("/api/users/{$student->id}/schools/{$school->id}")->assertOk();

        $fresh = $student->fresh();
        $this->assertNull($fresh->school_id);
        $this->assertNull($fresh->classroom_id);
    }

    public function test_removing_teacher_primary_school_updates_school_id(): void
    {
        $admin   = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $school1 = School::factory()->create();
        $school2 = School::factory()->create();
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER, 'school_id' => $school1->id]);
        $teacher->schools()->attach([$school1->id, $school2->id]);
        Sanctum::actingAs($admin);

        // Retire school1 (qui était le school_id principal)
        $this->deleteJson("/api/users/{$teacher->id}/schools/{$school1->id}")->assertOk();

        $fresh = $teacher->fresh();
        // school_id recalculé avec school2
        $this->assertEquals($school2->id, $fresh->school_id);
    }

    public function test_removing_non_assigned_school_returns_404(): void
    {
        $admin   = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $user    = User::factory()->create(['role' => User::ROLE_TEACHER]);
        $school  = School::factory()->create();
        Sanctum::actingAs($admin);

        $this->deleteJson("/api/users/{$user->id}/schools/{$school->id}")->assertNotFound();
    }

    public function test_validation_rejects_missing_school_id(): void
    {
        $admin   = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER]);
        Sanctum::actingAs($admin);

        $this->postJson("/api/users/{$teacher->id}/schools", [])
            ->assertUnprocessable();
    }

    public function test_validation_rejects_nonexistent_school(): void
    {
        $admin   = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $teacher = User::factory()->create(['role' => User::ROLE_TEACHER]);
        Sanctum::actingAs($admin);

        $this->postJson("/api/users/{$teacher->id}/schools", ['school_id' => 99999])
            ->assertUnprocessable();
    }
}

<?php

namespace Tests\Feature\Api;

use App\Models\Classroom;
use App\Models\School;
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

        $this->getJson('/api/classrooms')
            ->assertOk();
    }

    public function test_student_cannot_list_classrooms(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        Sanctum::actingAs($student);

        $this->getJson('/api/classrooms')->assertForbidden();
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

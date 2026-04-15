<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_users(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        User::factory()->count(2)->create();
        Sanctum::actingAs($admin);

        $this->getJson('/api/users')
            ->assertOk();
    }

    public function test_student_cannot_list_users(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        Sanctum::actingAs($student);

        $this->getJson('/api/users')->assertForbidden();
    }

    public function test_student_can_view_self_but_not_other_users(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $other = User::factory()->create(['role' => User::ROLE_STUDENT]);
        Sanctum::actingAs($student);

        $this->getJson('/api/users/'.$student->id)->assertOk();
        $this->getJson('/api/users/'.$other->id)->assertForbidden();
    }

    public function test_admin_can_create_user(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        Sanctum::actingAs($admin);

        $this->postJson('/api/users', [
            'name' => 'New User',
            'email' => 'new.user@test.local',
            'password' => 'Secret123!',
            'role' => User::ROLE_TEACHER,
        ])->assertCreated();
    }
}

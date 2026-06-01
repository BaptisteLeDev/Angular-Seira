<?php

namespace Tests\Feature\Api;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SchoolApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_schools(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        School::factory()->count(2)->create();
        Sanctum::actingAs($admin);

        $this->getJson('/api/schools')
            ->assertOk();
    }

    public function test_student_cannot_list_schools(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        Sanctum::actingAs($student);

        $this->getJson('/api/schools')->assertForbidden();
    }

    public function test_admin_can_create_school(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        Sanctum::actingAs($admin);

        $this->postJson('/api/schools', [
            'name' => 'Ecole Monto',
            'slug' => 'ecole-monto',
        ])->assertCreated();
    }
}

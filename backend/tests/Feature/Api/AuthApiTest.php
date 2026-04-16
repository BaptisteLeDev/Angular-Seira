<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_token_and_user(): void
    {
        $user = User::factory()->create([
            'email' => 'login@test.local',
            'password' => 'Secret123!',
            'role' => User::ROLE_STUDENT,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'login@test.local',
            'password' => 'Secret123!',
        ]);

        $response
            ->assertOk()
            ->assertJsonStructure([
                'tokenType',
                'token',
                'user' => ['email', 'role'],
            ])
            ->assertJsonPath('user.email', $user->email);
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'login@test.local',
            'password' => 'Secret123!',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'login@test.local',
            'password' => 'WrongPassword!',
        ]);

        $response->assertUnauthorized();
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_me_returns_authenticated_user(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_STUDENT]);
        Sanctum::actingAs($user);

        $this->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonFragment(['email' => $user->email]);
    }

    public function test_logout_revokes_current_token(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Logged out successfully.');
    }
}

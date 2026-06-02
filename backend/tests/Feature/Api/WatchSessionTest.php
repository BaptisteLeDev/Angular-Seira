<?php

namespace Tests\Feature\Api;

use App\Models\Chapter;
use App\Models\Classroom;
use App\Models\School;
use App\Models\Subject;
use App\Models\User;
use App\Models\Video;
use App\Models\VideoProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WatchSessionTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /** Crée la chaîne école → classe → matière → chapitre → vidéo + un élève lié. */
    private function createStudentWithVideo(int $duration = 240): array
    {
        $school    = School::factory()->create();
        $classroom = Classroom::factory()->create(['school_id' => $school->id]);
        $subject   = Subject::factory()->create(['school_id' => $school->id]);
        $classroom->subjects()->attach($subject->id);
        $chapter = Chapter::factory()->create(['subject_id' => $subject->id]);
        $video   = Video::factory()->create([
            'chapter_id'       => $chapter->id,
            'duration_seconds' => $duration,
        ]);
        $student = User::factory()->create([
            'role'         => User::ROLE_STUDENT,
            'school_id'    => $school->id,
            'classroom_id' => $classroom->id,
        ]);

        return compact('student', 'video', 'school', 'classroom', 'subject');
    }

    private function requestToken(int $videoId, int $segmentStart = 0): array
    {
        $response = $this->postJson('/api/watch-sessions/request', [
            'video_id'      => $videoId,
            'segment_start' => $segmentStart,
        ]);
        $response->assertCreated();
        return $response->json();
    }

    // -------------------------------------------------------------------------
    // POST /api/watch-sessions/request
    // -------------------------------------------------------------------------

    public function test_request_returns_401_if_not_authenticated(): void
    {
        $video = Video::factory()->create(['duration_seconds' => 120]);

        $this->postJson('/api/watch-sessions/request', [
            'video_id'      => $video->id,
            'segment_start' => 0,
        ])->assertUnauthorized();
    }

    public function test_admin_can_request_a_watch_token(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $video = Video::factory()->create(['duration_seconds' => 120]);
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/watch-sessions/request', [
            'video_id'      => $video->id,
            'segment_start' => 0,
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['token', 'seg_start', 'seg_end', 'expires_at']);
    }

    public function test_token_seg_end_is_capped_at_video_duration(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        // Vidéo de 10 secondes — seg_end doit être 10, pas 30
        $video = Video::factory()->create(['duration_seconds' => 10]);
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/watch-sessions/request', [
            'video_id'      => $video->id,
            'segment_start' => 0,
        ]);

        $response->assertCreated();
        $this->assertEquals(10, $response->json('seg_end'));
    }

    public function test_student_with_classroom_access_can_request_token(): void
    {
        ['student' => $student, 'video' => $video] = $this->createStudentWithVideo();
        Sanctum::actingAs($student);

        $this->postJson('/api/watch-sessions/request', [
            'video_id'      => $video->id,
            'segment_start' => 0,
        ])->assertCreated();
    }

    public function test_student_without_classroom_access_gets_403(): void
    {
        $school    = School::factory()->create();
        $classroom = Classroom::factory()->create(['school_id' => $school->id]);
        // Matière NON rattachée à la classe de l'élève
        $subject = Subject::factory()->create(['school_id' => $school->id]);
        $chapter = Chapter::factory()->create(['subject_id' => $subject->id]);
        $video   = Video::factory()->create(['chapter_id' => $chapter->id, 'duration_seconds' => 120]);

        $student = User::factory()->create([
            'role'         => User::ROLE_STUDENT,
            'school_id'    => $school->id,
            'classroom_id' => $classroom->id,
        ]);
        Sanctum::actingAs($student);

        $this->postJson('/api/watch-sessions/request', [
            'video_id'      => $video->id,
            'segment_start' => 0,
        ])->assertForbidden();
    }

    public function test_request_returns_422_when_segment_start_exceeds_duration(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $video = Video::factory()->create(['duration_seconds' => 60]);
        Sanctum::actingAs($admin);

        $this->postJson('/api/watch-sessions/request', [
            'video_id'      => $video->id,
            'segment_start' => 60, // == duration, donc invalide
        ])->assertUnprocessable();
    }

    // -------------------------------------------------------------------------
    // POST /api/watch-sessions/heartbeat
    // -------------------------------------------------------------------------

    public function test_heartbeat_returns_401_if_not_authenticated(): void
    {
        $this->postJson('/api/watch-sessions/heartbeat', [
            'token' => 'faketoken',
        ])->assertUnauthorized();
    }

    public function test_heartbeat_credits_watched_seconds_on_valid_token(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $video = Video::factory()->create(['duration_seconds' => 240]);
        Sanctum::actingAs($admin);

        $t0 = Carbon::now();
        Carbon::setTestNow($t0);

        $tokenData = $this->requestToken($video->id, 0);

        // Avance le temps de 26s (iat + 30 - 5 = iat + 25 → 26 > 25, valide)
        Carbon::setTestNow($t0->copy()->addSeconds(26));

        $response = $this->postJson('/api/watch-sessions/heartbeat', [
            'token' => $tokenData['token'],
        ]);

        $response->assertOk()
            ->assertJsonStructure(['validated_seconds', 'segment_validated', 'completion_percent', 'status'])
            ->assertJson(['segment_validated' => 30, 'status' => 'in_progress']);

        Carbon::setTestNow(null);
    }

    public function test_heartbeat_creates_video_progress_if_not_exists(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $video = Video::factory()->create(['duration_seconds' => 240]);
        Sanctum::actingAs($admin);

        $this->assertDatabaseMissing('video_progress', ['user_id' => $admin->id, 'video_id' => $video->id]);

        $t0 = Carbon::now();
        Carbon::setTestNow($t0);
        $tokenData = $this->requestToken($video->id, 0);
        Carbon::setTestNow($t0->copy()->addSeconds(26));

        $this->postJson('/api/watch-sessions/heartbeat', ['token' => $tokenData['token']])->assertOk();

        $this->assertDatabaseHas('video_progress', [
            'user_id'  => $admin->id,
            'video_id' => $video->id,
        ]);

        Carbon::setTestNow(null);
    }

    public function test_heartbeat_accumulates_across_multiple_segments(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $video = Video::factory()->create(['duration_seconds' => 240]);
        Sanctum::actingAs($admin);

        $t0 = Carbon::now();

        // Segment 1 : [0, 30]
        Carbon::setTestNow($t0);
        $tok1 = $this->requestToken($video->id, 0);
        Carbon::setTestNow($t0->copy()->addSeconds(26));
        $this->postJson('/api/watch-sessions/heartbeat', ['token' => $tok1['token']])->assertOk();

        // Segment 2 : [30, 60]
        Carbon::setTestNow($t0->copy()->addSeconds(30));
        $tok2 = $this->requestToken($video->id, 30);
        Carbon::setTestNow($t0->copy()->addSeconds(57));
        $response = $this->postJson('/api/watch-sessions/heartbeat', ['token' => $tok2['token']]);

        $response->assertOk()->assertJson(['validated_seconds' => 60]);

        Carbon::setTestNow(null);
    }

    public function test_heartbeat_caps_validated_seconds_at_video_duration(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        // Vidéo très courte : 20s — le segment de 30s sera tronqué à 20
        $video = Video::factory()->create(['duration_seconds' => 20]);

        // Crée un progress avec déjà 15s validées
        VideoProgress::factory()->create([
            'user_id'                   => $admin->id,
            'video_id'                  => $video->id,
            'watched_seconds_validated' => 15,
            'completion_percent'        => 75.0,
            'status'                    => 'in_progress',
        ]);

        Sanctum::actingAs($admin);

        $t0 = Carbon::now();
        Carbon::setTestNow($t0);
        // Segment [0, 20] = 20 secondes
        $tokenData = $this->requestToken($video->id, 0);
        Carbon::setTestNow($t0->copy()->addSeconds(16)); // 20 - 5 + 1

        $response = $this->postJson('/api/watch-sessions/heartbeat', ['token' => $tokenData['token']]);
        $response->assertOk();

        // Plafonné à 20, pas 15 + 20 = 35
        $this->assertEquals(20, $response->json('validated_seconds'));
        $this->assertEquals(100.0, $response->json('completion_percent'));

        Carbon::setTestNow(null);
    }

    public function test_heartbeat_sets_status_to_completed_when_fully_watched(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $video = Video::factory()->create(['duration_seconds' => 30]);
        Sanctum::actingAs($admin);

        $t0 = Carbon::now();
        Carbon::setTestNow($t0);
        $tokenData = $this->requestToken($video->id, 0);
        Carbon::setTestNow($t0->copy()->addSeconds(26));

        $response = $this->postJson('/api/watch-sessions/heartbeat', ['token' => $tokenData['token']]);
        $response->assertOk()->assertJson(['status' => 'completed', 'completion_percent' => 100.0]);

        Carbon::setTestNow(null);
    }

    public function test_heartbeat_rejects_invalid_token_format(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        Sanctum::actingAs($admin);

        $this->postJson('/api/watch-sessions/heartbeat', [
            'token' => 'pas-un-token-valide',
        ])->assertUnprocessable();
    }

    public function test_heartbeat_rejects_tampered_signature(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $video = Video::factory()->create(['duration_seconds' => 120]);
        Sanctum::actingAs($admin);

        $t0 = Carbon::now();
        Carbon::setTestNow($t0);
        $tokenData = $this->requestToken($video->id, 0);

        // Falsification de la signature
        [$payload] = explode('.', $tokenData['token'], 2);
        $tamperedToken = $payload . '.invalidsignatureXXXX';

        Carbon::setTestNow($t0->copy()->addSeconds(26));

        $this->postJson('/api/watch-sessions/heartbeat', ['token' => $tamperedToken])
            ->assertUnprocessable()
            ->assertJsonPath('error', 'Signature de token invalide.');

        Carbon::setTestNow(null);
    }

    public function test_heartbeat_rejects_token_belonging_to_another_user(): void
    {
        $admin   = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $video   = Video::factory()->create(['duration_seconds' => 120]);

        // Admin demande le token
        Sanctum::actingAs($admin);
        $t0 = Carbon::now();
        Carbon::setTestNow($t0);
        $tokenData = $this->requestToken($video->id, 0);

        // Student essaie de l'utiliser
        Sanctum::actingAs($student);
        Carbon::setTestNow($t0->copy()->addSeconds(26));

        $this->postJson('/api/watch-sessions/heartbeat', ['token' => $tokenData['token']])
            ->assertUnprocessable()
            ->assertJsonPath('error', 'Token lié à un autre utilisateur.');

        Carbon::setTestNow(null);
    }

    public function test_heartbeat_rejects_replay_of_same_token(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $video = Video::factory()->create(['duration_seconds' => 240]);
        Sanctum::actingAs($admin);

        $t0 = Carbon::now();
        Carbon::setTestNow($t0);
        $tokenData = $this->requestToken($video->id, 0);
        Carbon::setTestNow($t0->copy()->addSeconds(26));

        // Premier heartbeat — OK
        $this->postJson('/api/watch-sessions/heartbeat', ['token' => $tokenData['token']])->assertOk();

        // Deuxième heartbeat avec le même token — replay
        $this->postJson('/api/watch-sessions/heartbeat', ['token' => $tokenData['token']])
            ->assertUnprocessable()
            ->assertJsonPath('error', 'Replay détecté : token déjà consommé.');

        Carbon::setTestNow(null);
    }

    public function test_heartbeat_rejects_submission_too_early(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $video = Video::factory()->create(['duration_seconds' => 120]);
        Sanctum::actingAs($admin);

        $t0 = Carbon::now();
        Carbon::setTestNow($t0);
        $tokenData = $this->requestToken($video->id, 0);

        // Soumis à T+5, alors que le minimum est T+25 (30-5)
        Carbon::setTestNow($t0->copy()->addSeconds(5));

        $this->postJson('/api/watch-sessions/heartbeat', ['token' => $tokenData['token']])
            ->assertUnprocessable()
            ->assertJsonFragment(['error' => 'Heartbeat soumis trop tôt — attendez encore 20s.']);

        Carbon::setTestNow(null);
    }

    public function test_heartbeat_rejects_expired_token_past_late_buffer(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $video = Video::factory()->create(['duration_seconds' => 120]);
        Sanctum::actingAs($admin);

        $t0 = Carbon::now();
        Carbon::setTestNow($t0);
        $tokenData = $this->requestToken($video->id, 0);

        // T + 91s > maxSubmitAt (T + 30 + 60 = T + 90)
        Carbon::setTestNow($t0->copy()->addSeconds(91));

        $this->postJson('/api/watch-sessions/heartbeat', ['token' => $tokenData['token']])
            ->assertUnprocessable()
            ->assertJsonPath('error', 'Token expiré (délai de soumission dépassé).');

        Carbon::setTestNow(null);
    }

    // -------------------------------------------------------------------------
    // Protection de VideoProgress (watched_seconds_validated)
    // -------------------------------------------------------------------------

    public function test_create_video_progress_ignores_watched_seconds_from_client(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $video   = Video::factory()->create();
        Sanctum::actingAs($student);

        $this->postJson('/api/video-progress', [
            'video_id'                  => $video->id,
            'watched_seconds_validated' => 9999, // doit être ignoré
            'completion_percent'        => 50,
            'status'                    => 'in_progress',
        ])->assertCreated();

        $this->assertDatabaseHas('video_progress', [
            'user_id'                   => $student->id,
            'video_id'                  => $video->id,
            'watched_seconds_validated' => 0, // toujours 0 à la création
        ]);
    }

    public function test_patch_video_progress_cannot_modify_watched_seconds(): void
    {
        $student  = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $video    = Video::factory()->create();
        $progress = VideoProgress::factory()->create([
            'user_id'                   => $student->id,
            'video_id'                  => $video->id,
            'watched_seconds_validated' => 0,
            'status'                    => 'not_started',
        ]);
        Sanctum::actingAs($student);

        $this->json('PATCH', "/api/video-progress/{$progress->id}", [
            'watched_seconds_validated' => 9999,
            'status'                    => 'in_progress',
        ], ['Content-Type' => 'application/merge-patch+json'])->assertOk();

        $this->assertDatabaseHas('video_progress', [
            'id'                        => $progress->id,
            'watched_seconds_validated' => 0, // inchangé
            'status'                    => 'in_progress',
        ]);
    }
}
